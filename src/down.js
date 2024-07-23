// @ts-check
const fs = require("node:fs");
const path = require("node:path");
const { getDb } = require("./db");
const { pathData } = require("./path-data");
const { EJSON } = require('bson');
const { rm } = require("node:fs/promises");
const AdmZip = require("adm-zip");

const { existsSync, mkdirSync } = fs;
const { writeFile } = fs.promises;

/**
 * @param {import("mongodb").Db} db
 */
const down = async (db) => {
  const collections = await db.collections();

  await rm(pathData, { recursive: true });

  for (const collection of  collections) {
    const time1 = performance.now()

    const arr = await collection.find().toArray();

    const dirName = pathData

    if (!existsSync(dirName)) {
      mkdirSync(dirName, { recursive: true });
    }

    const filePath = path.join(dirName, collection.namespace + ".json");

    const data = EJSON.stringify(arr)

    await writeFile(filePath, data, { flag: "w" });

    const time2 = performance.now()
    const time = ((time2 - time1) / 1000).toFixed(2);
    console.log(`${collection.collectionName} in ${time} seconds`);
  }
};

function generarNombreBackup() {
  const ahora = new Date();
  const dia = ahora.getDate().toString().padStart(2, '0');
  const mes = (ahora.getMonth() + 1).toString().padStart(2, '0'); // Los meses comienzan desde 0
  const ano = ahora.getFullYear().toString().slice(-2); // Obtiene los últimos 2 dígitos del año
  const horas = ahora.getHours().toString().padStart(2, '0');
  const minutos = ahora.getMinutes().toString().padStart(2, '0');
  const segundos = ahora.getSeconds().toString().padStart(2, '0');

  return `${dia}-${mes}-${ano}--${horas}-${minutos}-${segundos}.zip`;
}

const createZip = async () => {
  const zip = new AdmZip()
  const files = fs.readdirSync(pathData);

  for (const file of files) {
    const filePath = path.join(pathData, file);
    zip.addLocalFile(filePath);
  }

  const backupDir = path.join(__dirname, 'backup')

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const zipAsBuffer = await zip.toBufferPromise()

  const zipPath = path.join(backupDir, generarNombreBackup())
  await writeFile(zipPath, zipAsBuffer);
}

async function main() {
  try {
    const db = await getDb();

    await down(db);

    await createZip()
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

main();