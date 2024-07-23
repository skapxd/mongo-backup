// @ts-check
require("dotenv").config();
const mongodb = require("mongodb");

/**
 * @returns {Promise<import("mongodb").Db>}
 */
module.exports.getDb = async () => {
  const dbName = process.env.MONGO_DB;
  if (!dbName) throw new Error(`MONGO_DB is not defined\nMONGO_DB=${dbName}`);

  const url = process.env.MONGO_URL;
  if (!url) throw new Error(`MONGO_URL is not defined\nMONGO_URL=${url}`);

  const client = new mongodb.MongoClient(url);

  await client.connect();

  const db = client.db(dbName);

  return db
};