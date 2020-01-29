const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const serialize = require("php-serialize");

const b64Encode = str => {
  if (_.isString(str) && !_.isEmpty(str)) {
    return Buffer.from(str).toString("base64");
  }
  return str;
};

const b64Decode = str => {
  if (_.isString(str) && !_.isEmpty(str)) {
    return Buffer.from(str, "base64").toString("ascii");
  }
  return str;
};

const md5Hash = str => {
  if (_.isString(str) && !_.isEmpty(str)) {
    return crypto
      .createHash("md5")
      .update(str)
      .digest("hex");
  }
  return str;
};

const generateHash = (plain, next) => {
  _.isEmpty(plain)
    ? next(null, null)
    : bcrypt.genSalt((err, salt) => {
        if (err) return next(err);
        bcrypt.hash(plain, salt, function(err, hashed) {
          if (err) return next(err);
          return next(null, { plain, hashed });
        });
      });
};

const possibleChars =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%-=";

const generatePassword = (len = 16, possible = possibleChars) => {
  let length = _.toSafeInteger(len);
  if (!length) return "";

  length = _.min([length, 100]);
  length = _.max([0, length]);

  let result = "";

  for (let i = 0; i < length; i++) {
    result += possible.charAt(Math.floor(Math.random() * _.size(possible)));
  }

  return result;
};

const verifyHash = (plain, hash) => {
  return !_.isEmpty(plain) && bcrypt.compareSync(plain, hash);
};

const phpCrypter = "aes-256-cbc";
const phpCryptKey = "NjHbCZZCcXaxgsSNH2Xpl3iIlu2gQEk1";

const phpEncrypt = str => {
  let result = "";
  if (_.isString(str)) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(phpCrypter, phpCryptKey, iv);
      const value = Buffer.concat([
        cipher.update(serialize.serialize(str)),
        cipher.final()
      ]).toString("base64");

      const hmac = crypto.createHmac("sha256", phpCryptKey);
      hmac.update(iv.toString("base64").concat(value), "utf8");

      const json = JSON.stringify({
        iv: iv.toString("base64"),
        value,
        mac: hmac.digest().toString("hex")
      });
      result = b64Encode(json);
    } catch (ignored) {}
  }
  return result;
};

const phpDecrypt = str => {
  let result = "";
  if (_.isString(str)) {
    try {
      const json = JSON.parse(b64Decode(str));
      const iv = Buffer.from(json.iv, "base64");
      const value = Buffer.from(json.value, "base64");

      const decipher = crypto.createDecipheriv(phpCrypter, phpCryptKey, iv);
      let decrypted = decipher.update(value, "binary", "utf8");
      decrypted += decipher.final("utf8");

      result = serialize.unserialize(decrypted);
    } catch (ignored) {}
  }
  return result;
};

module.exports = {
  b64Encode,
  b64Decode,
  md5Hash,
  generateHash,
  generatePassword,
  verifyHash,
  phpEncrypt,
  phpDecrypt
};