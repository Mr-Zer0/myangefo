import initSqlJs, { type Database } from "sql.js";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: () => "/sql-wasm.wasm",
      });
      const resp = await fetch("/myangefo.db");
      const buf = await resp.arrayBuffer();
      return new SQL.Database(new Uint8Array(buf));
    })();
  }
  return dbPromise;
}
