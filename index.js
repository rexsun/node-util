const lodash = (function fixLodash(_) {
  const upgrade = (obj, path, getVal) => {
    if (_.isObject(obj) && _.isString(path) && _.isFunction(getVal)) {
      const originVal = _.get(obj, path);

      if (!_.isEmpty(originVal)) {
        const archivePath = `__${path}__`;
        _.set(obj, archivePath, originVal);
      }

      _.set(obj, path, getVal(originVal));
    }
    return obj;
  };

  upgrade(_, "isEmpty", is_empty => o =>
    (!_.isNumber(o) && !_.isDate(o) && !_.isEqual(o, true) && is_empty(o)) ||
    _.isEqual(o, 0)
  );

  const { diff } = require("deep-diff");

  _.set(_, "upgrade", upgrade);
  _.set(_, "deepDiff", diff);

  return _;
})(require("lodash"));

const utilMeta = (function loadUtilMeta(_) {
  const fs = require("fs");
  const path = require("path");
  const nodeUtil = require("util");

  const relpathUtils = "./src";
  const pathUtils = path.join(__dirname, "src");

  const modules = _.map(fs.readdirSync(pathUtils), o =>
    _.get(_.split(o, ".", 1), [0], "")
  );

  const meta = _.reduce(
    modules,
    (r, o) => {
      !_.isEmpty(o) && _.set(r, o, require(`${relpathUtils}/${o}`));
      return r;
    },
    {}
  );

  _.set(meta, "node", nodeUtil);

  const init = ($global, $sails) => {
    const logConsole = console.log;
    const logInfo = _.get($sails, ["log", "debug"], logConsole);

    logInfo({message: ">>>> node-util initializing ..."});

    _.set($global, "_", _);
    _.set($global, "async", require("async"));
    _.set($global, "moment", require("moment"));
    _.set($global, "assert", require("assert"));
    _.set($global, "request", require("request"));
    _.set($global, "util", meta);
    _.set($global, "log", logInfo);
    _.set($global, "appPwd", process.cwd());

    _.set($global, "appEnvironment", _.get(process.env, "APP_ENV", "local"));
    _.set($global, "nodeEnvironment", _.get(process.env, "NODE_ENV", "development"));

    logInfo({
      message: "<<<< node-util initialized",
      nodeEnvironment,
      appEnvironment,
      appPwd
    });

    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

    if (!!$sails) {
      const EventEmitter = require("events");
      const evtEmitter = new EventEmitter();
      _.set($sails, "customEvent", evtEmitter);

      const do$UnknownException = err => {
        const now = moment.utc().format("YYYY-MM-DD HH:mm:ss.SSS");
        logConsole(`!!ERROR!! ${now}`, err);
        evtEmitter.emit("error", err);
      };

      process.on("uncaughtException", do$UnknownException);
      process.on("unhandledRejection", do$UnknownException);
    }
  };

  return _.merge(meta, {
    init
  });
})(lodash);

module.exports = utilMeta;
