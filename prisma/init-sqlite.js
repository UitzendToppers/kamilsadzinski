import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function resolveDatabasePath() {
  const value = process.env.DATABASE_URL || "file:./dev.db";
  const rawPath = value.replace(/^file:/, "");
  if (path.isAbsolute(rawPath)) return rawPath;
  return path.join(__dirname, rawPath);
}

const dbPath = resolveDatabasePath();
const sqlPath = path.join(__dirname, "migrations", "000001_init", "migration.sql");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sql = fs.readFileSync(sqlPath, "utf8");
const db = new sqlite3.Database(dbPath);

db.exec("PRAGMA foreign_keys = ON;\n" + sql, (error) => {
  if (error) {
    db.close();
    console.error(error);
    process.exit(1);
  }
  db.all('PRAGMA table_info("Order")', (columnsError, rows) => {
    if (columnsError) {
      db.close();
      console.error(columnsError);
      process.exit(1);
    }
    const hasBooking = rows.some((row) => row.name === "bookingId");
    const close = () => {
      db.close();
      console.log(`Baza SQLite gotowa: ${dbPath}`);
    };
    if (hasBooking) return close();
    db.exec('ALTER TABLE "Order" ADD COLUMN "bookingId" TEXT;', (alterError) => {
      if (alterError) {
        db.close();
        console.error(alterError);
        process.exit(1);
      }
      close();
    });
  });
});
