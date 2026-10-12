import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), 'data.sqlite')
  : path.join(process.cwd(), 'data-dev.sqlite');

let db: Database.Database;

// Singleton pattern to avoid multiple connections
if (process.env.NODE_ENV === 'production') {
  db = new Database(dbPath);
} else {
  if (!(global as any)._db) {
    (global as any)._db = new Database(dbPath);
  }
  db = (global as any)._db;
}

db.pragma('journal_mode = WAL');

export default db;
