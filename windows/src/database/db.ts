import Database from 'sqlite3';
import { promisify } from 'util';
import RNFS from 'react-native-fs';
import path from 'path';

// Windows-specific database implementation
class WindowsDatabase {
  private db: Database.Database | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Create database directory in user's documents folder
      const documentsPath = RNFS.DocumentDirectoryPath;
      const dbDir = path.join(documentsPath, 'LNReader');
      const dbPath = path.join(dbDir, 'lnreader.db');

      // Ensure directory exists
      await RNFS.mkdir(dbDir);

      // Open database
      this.db = new Database.Database(dbPath);
      
      // Promisify database methods
      const run = promisify(this.db.run.bind(this.db));
      const get = promisify(this.db.get.bind(this.db));
      const all = promisify(this.db.all.bind(this.db));

      // Set database configuration
      await run('PRAGMA busy_timeout = 5000');
      await run('PRAGMA cache_size = 10000');
      await run('PRAGMA foreign_keys = ON');
      await run('PRAGMA journal_mode = WAL');
      await run('PRAGMA synchronous = NORMAL');
      await run('PRAGMA temp_store = MEMORY');

      this.isInitialized = true;
      console.log('Windows database initialized at:', dbPath);
    } catch (error) {
      console.error('Failed to initialize Windows database:', error);
    }
  }

  public async runAsync(sql: string, ...params: any[]): Promise<void> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }
    
    const run = promisify(this.db.run.bind(this.db));
    await run(sql, ...params);
  }

  public async getFirstAsync<T>(sql: string, ...params: any[]): Promise<T | null> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const get = promisify(this.db.get.bind(this.db));
    const result = await get(sql, ...params);
    return result as T | null;
  }

  public async getAllAsync<T>(sql: string, ...params: any[]): Promise<T[]> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const all = promisify(this.db.all.bind(this.db));
    const results = await all(sql, ...params);
    return results as T[];
  }

  public async execAsync(sql: string): Promise<void> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const exec = promisify(this.db.exec.bind(this.db));
    await exec(sql);
  }

  public async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const run = promisify(this.db.run.bind(this.db));
    
    try {
      await run('BEGIN TRANSACTION');
      await fn();
      await run('COMMIT');
    } catch (error) {
      await run('ROLLBACK');
      throw error;
    }
  }

  public prepareSync(sql: string) {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(sql);
    return {
      executeSync: (...params: any[]) => {
        stmt.run(...params);
      },
      finalizeSync: () => {
        stmt.finalize();
      }
    };
  }

  public getFirstSync<T>(sql: string, ...params: any[]): T | null {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const result = this.db.prepare(sql).get(...params);
    return result as T | null;
  }

  public getAllSync<T>(sql: string, ...params: any[]): T[] {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized');
    }

    const results = this.db.prepare(sql).all(...params);
    return results as T[];
  }
}

export const db = new WindowsDatabase();

// Table creation queries (same as Android)
const createNovelTableQuery = `
    CREATE TABLE IF NOT EXISTS Novel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        pluginId TEXT NOT NULL,
        cover TEXT,
        summary TEXT,
        author TEXT,
        artist TEXT,
        status TEXT,
        genres TEXT,
        inLibrary INTEGER DEFAULT 0,
        unread INTEGER DEFAULT 0,
        lastRead TEXT,
        lastUpdate TEXT,
        chaptersDownloaded INTEGER DEFAULT 0,
        chaptersUnread INTEGER DEFAULT 0,
        totalChapters INTEGER DEFAULT 0,
        lastReadAt TEXT,
        lastUpdatedAt TEXT
    )
`;

const createChapterTableQuery = `
    CREATE TABLE IF NOT EXISTS Chapter (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        novelId INTEGER NOT NULL,
        path TEXT NOT NULL,
        name TEXT NOT NULL,
        releaseTime TEXT,
        bookmark INTEGER DEFAULT 0, 
        unread INTEGER DEFAULT 1,
        readTime TEXT,
        isDownloaded INTEGER DEFAULT 0,
        updatedTime TEXT,
        chapterNumber REAL NULL,
        page TEXT DEFAULT "1",
        position INTEGER DEFAULT 0,
        progress INTEGER,
        UNIQUE(path, novelId),
        FOREIGN KEY (novelId) REFERENCES Novel(id) ON DELETE CASCADE
    )
`;

const createCategoriesTableQuery = `
    CREATE TABLE IF NOT EXISTS Category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sort INTEGER DEFAULT 0
    )
`;

const createNovelCategoryTableQuery = `
    CREATE TABLE IF NOT EXISTS NovelCategory (
        novelId INTEGER NOT NULL,
        categoryId INTEGER NOT NULL,
        PRIMARY KEY (novelId, categoryId),
        FOREIGN KEY (novelId) REFERENCES Novel(id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE CASCADE
    )
`;

const createRepositoryTableQuery = `
    CREATE TABLE IF NOT EXISTS Repository (
        url TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        lang TEXT
    )
`;

export const createTables = async () => {
  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync(createNovelTableQuery);
      await db.runAsync(createChapterTableQuery);
      await db.runAsync(createCategoriesTableQuery);
      await db.runAsync(createNovelCategoryTableQuery);
      await db.runAsync(createRepositoryTableQuery);
      
      // Create default category
      await db.runAsync(
        'INSERT OR IGNORE INTO Category (id, name, sort) VALUES (0, "Default", 0)'
      );
      
      // Create indexes
      await db.runAsync(
        'CREATE INDEX IF NOT EXISTS chapterNovelIdIndex ON Chapter(novelId, position, page, id)'
      );
      await db.runAsync(
        'CREATE INDEX IF NOT EXISTS novelIndex ON Novel(name, pluginId, inLibrary)'
      );
    });
    
    console.log('Windows database tables created successfully');
  } catch (error) {
    console.error('Failed to create database tables:', error);
  }
};