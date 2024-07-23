// @ts-check
const fs = require("node:fs");
const path = require("node:path");
const { getDb } = require("./db");
const { pathData } = require("./path-data");

const { existsSync, mkdirSync } = fs;
const { writeFile } = fs.promises;

/**
 * @param {import("mongodb").Db} db
 */
const down = async (db) => {
  const collections = await db.collections();

  for (const collection of collections) {
    const time1 = performance.now()

    const arr = await collection.find().toArray();

    const dirName = pathData

    if (!existsSync(dirName)) {
      mkdirSync(dirName, { recursive: true });
    }

    const filePath = path.join(dirName, collection.namespace + ".json");

    const data = JSON.stringify(arr, null, 2)

    await writeFile(filePath, data, { flag: "w" });

    const time2 = performance.now()
    const time = ((time2 - time1) / 1000).toFixed(2);
    console.log(`${collection.collectionName} in ${time} seconds`);
  }
};

async function main() {
  try {
    const db = await getDb();

    await down(db);
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

main();