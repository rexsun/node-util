const httpProxy = require('http-proxy');
const createProxyServer = httpProxy.createProxyServer;

function getResponseError(error, response, body) {
  if (error) return error;

  const responseCode = _.toSafeInteger(_.get(response, 'statusCode', 0));
  if (responseCode >= 200 && responseCode < 400) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch (e) {
    return response.statusMessage;
  }
}

const defaultHeaders = {
  'accept': 'application/json',
  'content-type': 'application/json',
  'cache-control': 'no-cache'
};

const doRequest = (params, next) => {
  const {
    url,
    method,
    headers,
    plain,
    auth,
    body,
    qs
  } = params;

  assert(url);
  assert(method);

  const useQuerystring = !_.isEmpty(qs);

  async.auto({
    request: (callback) => {
      const options = {
        url,
        method,
        auth,
        qs,
        useQuerystring,
        body: _.isString(body) ? body : util.func.attempt(() => JSON.stringify(body), ''),
        headers: _.isObject(headers) ? headers : defaultHeaders
      };

      log('Request -->> endpoint:', options);

      request(options, function (error, response, body) {

        const responseCode = _.toSafeInteger(_.get(response, 'statusCode', 0));
        log('Respond <<-- enbdpoint:', url, method, responseCode, error, body);

        const err = getResponseError(error, response, body);
        if (!_.isEmpty(err)) {
          log("<-- Respond ERR -->", err);
        }

        callback(err, body);
      });
    },
    parse: ['request', (results, callback) => {
      const response = _.get(results, 'request', null);

      const result = !plain ?
        util.func.attempt(() => JSON.parse(response), response) :
        response;

      callback(null, result);
    }]
  }, util.func.doNext(params, 'parse', next));
};

module.exports = {
  doRequest,
  createProxyServer,
};
