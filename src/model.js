const id = "id";
const createdAt = "created_at";
const updatedAt = "updated_at";
const deletedAt = "deleted_at";
const extraJson = "extra_json";

const attributeMap = {
  [id]: {
    type: "number",
    columnType: "bigint",
    autoIncrement: true
  },
  [createdAt]: {
    type: "ref",
    columnType: "timestamp",
    autoCreatedAt: true
  },
  [updatedAt]: {
    type: "ref",
    columnType: "timestamp",
    autoUpdatedAt: true
  },
  [deletedAt]: {
    type: "ref",
    columnType: "datetime",
    defaultsTo: null
  },
  [extraJson]: {
    type: "json",
    columnType: "longtext"
  }
};

const stringify = (o, space) => {
  let cache = [];
  const output = JSON.stringify(
    o,
    function(key, val) {
      if (typeof val === "object" && val !== null) {
        if (cache.indexOf(val) !== -1) {
          // Circular reference found, discard key
          return;
        }
        // Store value in our collection
        cache.push(val);
      }
      return val;
    },
    space
  );
  cache = null;
  return output;
};

const toObject = o => {
  return util.func.attempt(function() {
    return JSON.parse(stringify(o));
  }, o);
};

const asteriskObject = o => {
  if (!_.isObject(o) || _.isEmpty(o)) {
    return o;
  }

  const result = o;
  const secitiveKeys = [
    "password",
    "secret",
    "ssn",
    "birthday",
    "birth_date",
    "dob",
    "ssntrace",
    "PersonalData"
  ];
  for (const sKey of secitiveKeys) {
    if (_.has(result, sKey)) {
      _.set(result, sKey, "******");
    }
  }
  return result;
};

const defineAttributes = (shared, sepcial) => {
  const p_special = sepcial || {};

  const result = (attributes =>
    !_.isEmpty(attributes) && _.isArray(attributes)
      ? _.reduce(
          attributes,
          (r, o) => {
            const attr = _.get(attributeMap, o);
            if (!_.isEmpty(attr)) {
              _.set(r, o, attr);
            }
            return r;
          },
          {}
        )
      : {})(shared);

  return _.merge(result, p_special);
};

const joinCollections = (
  major,
  appendix,
  majorKey,
  appendixKey,
  populateMap
) => {
  if (!_.isArray(major) || _.isEmpty(major)) return [];
  if (
    !_.isArray(appendix) ||
    _.isEmpty(appendix) ||
    !majorKey ||
    !appendixKey ||
    !(_.every(major, majorKey) && _.every(appendix, appendixKey))
  )
    return major;

  _.isEmpty(populateMap) &&
    (populateMap = {
      [majorKey]: {}
    });

  const appendixMap = _.reduce(
    appendix,
    (r, o) => {
      const key = o[appendixKey];
      (r[key] || (r[key] = [])).push(toObject(o));
      return r;
    },
    {}
  );

  return _.map(major, o => {
    let result = toObject(o);
    const appendArr = _.get(appendixMap, o[majorKey]);
    const append = _.size(appendArr) === 1 ? _.get(appendArr, 0) : appendArr;

    _.forIn(populateMap, (val, key) => {
      let populate = null;
      switch (true) {
        case _.isEqual(val, {}):
          populate = toObject(append);
          break;
        case _.isFunction(val):
          populate = val(append);
          break;
        case _.isEmpty(val):
          populate = _.get(append, key, null);
          break;
        case _.isString(val):
          populate = _.get(append, val, null);
          break;
        default:
          populate = _.get(append, val, null);
          break;
      }
      _.set(result, key, populate);
    });
    return result;
  });
};

const getSailsModel = model => {
  const Model = _.isString(model) ? sails.models[model] : model;
  _.isEmpty(Model) && console.error("Failed to load Sails Model:", model);
  return Model;
};

const createUpdate = (model, query, data, next) => {
  const Model = getSailsModel(model);

  _.isInteger(query) &&
    (query = {
      id: query
    });

  if (Model && query && data) {
    async.auto(
      {
        findOne: callback => {
          Model.findOne(query).exec(callback);
        },
        createUpdate: [
          "findOne",
          (results, callback) => {
            const findOne = _.get(results, "findOne");
            const pk = Model.primaryKey;
            const payload = pk === id ? _.omit(data, [pk]) : data;
            switch (true) {
              case _.isEmpty(findOne):
                Model.create(payload)
                  .fetch()
                  .exec(callback);
                break;
              default:
                Model.update({
                  [pk]: findOne[pk]
                })
                  .set(payload)
                  .fetch()
                  .exec(callback);
                break;
            }
          }
        ],
        result: [
          "createUpdate",
          (results, callback) => {
            const createUpdate = _.get(results, "createUpdate");
            callback(
              null,
              _.isArray(createUpdate) ? createUpdate[0] : createUpdate
            );
          }
        ]
      },
      util.func.doNext(data, "result", next)
    );
  } else {
    console.error("Failed to createUpdate:", model, query, data);
    next(null, data);
  }
};

module.exports = {
  id,
  createdAt,
  updatedAt,
  deletedAt,
  extraJson,
  toObject,
  defineAttributes,
  joinCollections,
  getSailsModel,
  createUpdate,
  stringify,
  asteriskObject
};
