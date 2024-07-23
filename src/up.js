// @ts-check
const { readdirSync, readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const { ObjectId } = require("mongodb");
const { getDb } = require("./db");
const { pathData } = require("./path-data");

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
    const collectionName = collection.split(".")[1];
    console.time(collectionName);

    const filePath = join(dirName, collection)
    if (!existsSync(filePath)) throw new Error(`File does not exist\n${filePath}`);

    const text = readFileSync(filePath, "utf-8");
    const json = JSON.parse(text);
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

    console.timeEnd(collectionName);
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