const deasync = require("deasync");
const validator = require("validator");

const timeout = ms => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const attempt = (func, defaultsTo = null) => {
  if (!_.isFunction(func)) return null;
  const result = _.attempt(func);
  return _.isError(result) ? defaultsTo : result;
};

const httpParam = (req, path, defaultsTo) => {
  var result = {};
  if (_.isEmpty(path) || !_.isString(path)) {
    result = _.get(req, "body", _.get(req, "query", defaultsTo));
  } else {
    result = _.get(
      req,
      `query.${path}`,
      _.get(req, `body.${path}`, defaultsTo)
    );
  }
  return result;
};

const parseOne = (obj, path, meta) => {
  let result = null;
  if (_.isNil(path)) return result;

  const from = _.get(meta, "from");
  const defaultsTo = _.get(meta, "defaultsTo");
  switch (true) {
    case from === "http":
      result = httpParam(obj, path, defaultsTo);
      break;
    case from === "path":
      result = _.get(obj, path, defaultsTo);
      break;
    case _.isFunction(from):
      result = attempt(() => from(obj), defaultsTo);
      break;
  }

  const validationError = [];
  const validatorMeta = _.get(meta, "validator", null);
  if (!_.isEmpty(validatorMeta) && _.isArray(validatorMeta)) {
    _.forEach(validatorMeta, (val, idx) => {
      const validatorName = _.get(val, "name");
      const validatorFunc = (name => {
        switch (name) {
          case "isRequired":
            return str => !_.isEmpty(str);
          default:
            return _.get(validator, validatorName);
        }
      })(validatorName);
      if (_.isFunction(validatorFunc)) {
        const warning = _.get(val, "message") || path;
        const validatorArgs = _.get(val, "args", null);
        const validated = validatorFunc(result + "", validatorArgs);
        if (!validated) {
          validationError.push({ validatorName, warning });
        }
      }
    });
  }

  if (!_.isEmpty(validationError)) {
    throw setBadRequestError({ path, validationError });
  }

  if (_.isNil(result)) return result;

  const convert = _.get(meta, "convert");
  switch (convert) {
    case "safeInteger":
      result = _.toSafeInteger(result);
      break;
    case "number":
      result = _.toNumber(result);
      break;
    case "boolean":
      result = !!result;
      break;
    case "moment":
      result = moment(result);
      break;
    case "object":
      result = attempt(_.partial(JSON.parse, result), result);
      break;
    case "array":
      result = _.toArray(result);
      break;
    case "stringify":
      result = JSON.stringify(result);
      break;
    case "function":
      if (_.isFunction(convert)) result = convert(result);
      break;
  }

  return result;
};

const parseParams = (req, meta) => {
  const result = {};
  _.forIn(meta, (val, key) => {
    const path = _.get(val, "path", key);
    _.set(result, key, parseOne(req, path, val));
  });
  return result;
};

const getErrorStack = (match = "/api/") => {
  const stackTrace = new Error().stack;
  const stackItems = _.split(stackTrace, "\n");

  return _.reduce(
    stackItems,
    (r, o) => (_.includes(o, match) ? `${r} <-- ${_.trim(o)}` : r),
    ""
  );
};

const doNext = (args, path, resolve, reject) => {
  assert(_.isFunction(resolve));

  return (err, results) => {
    const result = !!path ? _.get(results, path) : results;
    if (!!err) {
      const p_rej = _.isFunction(reject) ? reject : _.partial(resolve, _, null);

      console.error(
        JSON.stringify({
          stack: getErrorStack(),
          params: util.model.asteriskObject(args),
          error: err
        })
      );

      return _.isFunction(p_rej) && p_rej(err);
    }
    return resolve(null, result);
  };
};

const getKnowErrorName = () =>
  _.get(
    global[("sails", "config", "custom", "async", "knownErrorName")],
    "_KNOWN_ERROR_"
  );

const getResponseError = err => {
  const errKey = getKnowErrorName();
  return _.get(err, errKey, null);
};

const setResponseError = (code, body) => {
  const errKey = getKnowErrorName();
  return {
    [errKey]: {
      code,
      body
    }
  };
};

const setBadRequestError = exception => {
  return setResponseError("400", {
    exception
  });
};

const setFailRequestError = exception => {
  return setResponseError("500", {
    exception
  });
};

const responseMap = {
  "200": "ok",
  "204": "noContent",
  "400": "badRequest",
  "401": "unauthorized",
  "404": "notFound",
  "409": "conflict",
  "412": "preconditionFailed",
  "500": "serverError",
  "501": "notImplemented",
  "503": "serviceUnavailable"
};

const doResponse = res => {
  const resolve = _.get(res, "resolve", _.get(res, "ok"));
  const reject = _.get(res, "reject", _.get(res, "preconditionFailed"));

  assert(_.isFunction(resolve));
  assert(_.isFunction(reject));

  return (err, result) => {
    if (!err) {
      return resolve(result);
    } else {
      const resErr = getResponseError(err);
      if (!resErr) {
        return reject(err);
      } else {
        const { code, body } = resErr;
        const resMethod = _.get(res, _.get(responseMap, code, "notFound"));
        return resMethod(body);
      }
    }
  };
};

const sync = (func, next) => {
  let result = null;

  if (_.isFunction(func) && _.isFunction(next)) {
    let syncing = true;
    func((err, ret) => {
      syncing = false;
      result = ret;
      next(err, ret);
    });
    deasync.loopWhile(() => syncing);
  }

  return result;
};

const routeHandler = (paramMeta, resHandler) => async (req, res) => {
  const params = parseParams(req, paramMeta);
  const handler = doResponse(res);
  try {
    const result = await resHandler(params);
    return handler(null, result);
  } catch (ex) {
    return handler(ex, null);
  }
};

const isAsync = fn => {
  return (
    _.isFunction(fn) && _.get(fn, ["constructor", "name"]) === "AsyncFunction"
  );
};

module.exports = {
  timeout,
  attempt,
  parseParams,
  responseMap,
  getErrorStack,
  doNext,
  doResponse,
  getResponseError,
  setResponseError,
  setBadRequestError,
  setFailRequestError,
  sync,
  routeHandler,
  isAsync
};
