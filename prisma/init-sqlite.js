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

function run(statement) {
  return new Promise((resolve, reject) => {
    db.run(statement, (error) => (error ? reject(error) : resolve()));
  });
}

function all(statement) {
  return new Promise((resolve, reject) => {
    db.all(statement, (error, rows) => (error ? reject(error) : resolve(rows)));
  });
}

async function ensureColumn(table, name, definition) {
  const rows = await all(`PRAGMA table_info("${table}")`);
  if (!rows.some((row) => row.name === name)) {
    await run(`ALTER TABLE "${table}" ADD COLUMN "${name}" ${definition}`);
  }
}

db.exec("PRAGMA foreign_keys = ON;\n" + sql, (error) => {
  if (error) {
    db.close();
    console.error(error);
    process.exit(1);
  }
  (async () => {
    await ensureColumn("User", "phone", "TEXT");
    await ensureColumn("User", "role", "TEXT NOT NULL DEFAULT 'CUSTOMER'");
    await ensureColumn("User", "createdAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("User", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("Course", "currency", "TEXT NOT NULL DEFAULT 'PLN'");
    await ensureColumn("Course", "duration", "TEXT");
    await ensureColumn("Course", "level", "TEXT");
    await ensureColumn("Course", "imageUrl", "TEXT");
    await ensureColumn("Course", "sortOrder", "INTEGER NOT NULL DEFAULT 0");
    await ensureColumn("Course", "published", "BOOLEAN NOT NULL DEFAULT true");
    await ensureColumn("Course", "createdAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("Course", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("Order", "bookingId", "TEXT");
    await ensureColumn("Order", "currency", "TEXT NOT NULL DEFAULT 'PLN'");
    await ensureColumn("Order", "status", "TEXT NOT NULL DEFAULT 'DRAFT'");
    await ensureColumn("Order", "stripeIntentId", "TEXT");
    await ensureColumn("Order", "createdAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("Order", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("Payment", "provider", "TEXT NOT NULL DEFAULT 'stripe'");
    await ensureColumn("Payment", "providerId", "TEXT");
    await ensureColumn("Payment", "currency", "TEXT NOT NULL DEFAULT 'PLN'");
    await ensureColumn("Payment", "payload", "TEXT");
    await ensureColumn("Payment", "createdAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("Payment", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("SiteSection", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("Setting", "secret", "BOOLEAN NOT NULL DEFAULT false");
    await ensureColumn("Setting", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await ensureColumn("ContactSubmission", "phone", "TEXT");
    await ensureColumn("ContactSubmission", "source", "TEXT NOT NULL DEFAULT 'formularz kontaktowy'");
    await ensureColumn("ContactSubmission", "status", "TEXT NOT NULL DEFAULT 'NEW'");
    await ensureColumn("ContactSubmission", "createdAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    await ensureColumn("ContactSubmission", "updatedAt", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

    await run('CREATE UNIQUE INDEX IF NOT EXISTS "Purchase_userId_courseId_key" ON "Purchase"("userId", "courseId")');
  })()
    .then(() => {
      db.close();
      console.log(`Baza SQLite gotowa: ${dbPath}`);
    })
    .catch((migrationError) => {
      db.close();
      console.error(migrationError);
      process.exit(1);
    });
});
