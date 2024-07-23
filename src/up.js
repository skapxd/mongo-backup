// @ts-check
const { readdirSync, readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { ObjectId } = require("mongodb");
const { getDb } = require("./db");
const { pathData } = require("./path-data");
const { EJSON } = require('bson');

/**
 * @param {import('mongodb').Db} db
 */
const up = async (db) => {
  const dirName = pathData

  if (!existsSync(dirName)) throw new Error(`Dir directory does not exist\n${dirName}`);

  const collections = readdirSync(dirName).filter((file) =>
    file.endsWith(".json")
  );

  for (const collection of collections) {
    const time1 = performance.now()
    const collectionName = collection.split(".")[1];

    const filePath = join(dirName, collection)
    if (!existsSync(filePath)) throw new Error(`File does not exist\n${filePath}`);

    const text = readFileSync(filePath, "utf-8");
    const json = EJSON.parse(text);
    if (json.length === 0) continue;
    await db
      .createCollection(collectionName)
      .catch(() => console.log(`Collection already exists\n${collectionName}`));

    await db
      .collection(collectionName)
      .drop()
      .catch(() => console.log(`Collection does not exist\n${collectionName}`));

    const data = json.map((row) => {
      const { _id, ...rest } = row;

      const operation = {
        updateOne: {
          filter: { _id: new ObjectId(row._id) },
          update: { $set: rest },
          upsert: true,
        },
      };

      return operation;
    });
    await db
      .collection(collectionName)
      .bulkWrite(data, { ordered: false })
      .catch((e) =>
        console.log(
          `Error inserting data into \n${collectionName} -> ${collectionName}`
        )
      );

      const time2 = performance.now()
      const time = ((time2 - time1) / 1000).toFixed(2);
      console.log(`${collectionName} in ${time} seconds`);
  }
};

async function main() {
  try {
    const db = await getDb();

    await up(db);
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

main();