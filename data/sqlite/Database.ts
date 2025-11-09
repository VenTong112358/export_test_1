import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// 定义数据库类型
type Database = {
  transaction: (
    callback: (tx: any) => void,
    errorCallback?: (error: any) => void,
    successCallback?: () => void
  ) => void;
};

// Web-compatible in-memory cache for article storage
const webArticleCache = new Map<number, { content: string; title?: string; subtitle?: string; generated_at: string }>();

function openDatabase(): Database {
  if (Platform.OS === "web") {
    return {
      transaction: () => ({
        executeSql: () => {},
      }),
    };
  }

  return SQLite.openDatabaseSync("english_learning.db") as unknown as Database;
}

export const db = openDatabase();

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Word (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Text TEXT NOT NULL,
            Definition TEXT NOT NULL,
            ExampleSentence TEXT,
            CefrLevel TEXT,
            Mastery INTEGER DEFAULT 0,
            Favorite BOOLEAN DEFAULT 0,
            LearnedDate TEXT
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            date TEXT,
            tags TEXT,
            cefr_level TEXT
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS article_cache (
            log_id INTEGER PRIMARY KEY,
            content TEXT NOT NULL,
            generated_at TEXT NOT NULL,
            title TEXT,
            subtitle TEXT
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            words_learned INTEGER DEFAULT 0,
            quizzes_completed INTEGER DEFAULT 0,
            level_estimate TEXT
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS User (
            Id varchar(255) PRIMARY KEY NOT NULL,
            Username varchar(255) UNIQUE NOT NULL,
            DisplayName varchar(255),
            PhoneNumber varchar(20) UNIQUE NOT NULL,
            PasswordHash varchar(20) NOT NULL,
            CefrLevel char(2),
            Object varchar(30),
            DailyGoal INTEGER DEFAULT 10,
            ChickenLevel Double.
            ThemePreference varchar(255),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Tag(
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Text varchar(30) NOT NULL,
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS UserTag(
            UserID varchar(255) PRIMARY KEY NOT NULL,
            TagId INTEGER PRIMARY KEY NOT NULL,
            Tag varchar(30) NOT NULL,
            Foreign Key (UserID) REFERENCES User(Id),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS Word(
            Id varchar(20) PRIMARY KEY NOT NULL,
            Text varchar(20) NOT NULL,
            Definition varchar(255) NOT NULL,
            ExampleSentence varchar(600),
            CefrLevel char(2),
          );
        `);

        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS WordStatus(
            UserID varchar(255) PRIMARY KEY NOT NULL,
            WordID varchar(20) PRIMARY KEY NOT NULL, // how to link to Word table?
            Status varchar(30) NOT NULL,
            MasterLevel double,
            Foreign Key (UserID) REFERENCES User(Id), 
            Foreign Key (WordID) REFERENCES Word(Id),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS WordProgress(
            UserID varchar(255) PRIMARY KEY NOT NULL,
            WordID varchar(20) PRIMARY KEY NOT NULL,
            Foreign Key (UserID) References User(Id),
            Foreign Key (WordID) References Word(Id),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS WordClick(
            UserID varchar(255) PRIMARY KEY NOT NULL,
            WordID varchar(20) PRIMARY KEY NOT NULL,
            Foreign Key (UserID) References User(ID),
            Foreign Key (WordID) References Word(ID),
            Date datetime,
            Count INTEGER(10),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS WordClick(
            UserID varchar(255) PRIMARY KEY NOT NULL,
            WordID varchar(50) PRIMARY KEY NOT NULL,
            Date datetime,
            Foreign Key (UserID) References User(ID),
            Foreign Key (WordID) References Word(ID),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS DailySession(
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            UserID varchar(255) Primary Key NOT NULL,
            Date datetime,
            Status varchar(30),
            Foreign Key (UserID) References User(ID),
          );
        `);
        tx.executeSql(`
          CREATE TABLE IF NOT EXISTS LearningSession(
            SessionID Integer PRIMARY KEY,
            UserID varchar(255) Primary Key NOT NULL,
            Date datetime,
            WordID varchar(50) NOT NULL,
            Foreign Key (SessionID) References DailySession(ID),
            Foreign Key (UserID) References DailySession(UserID),
            Foreign Key (Date) References DailySession(Date),
            Foreign Key (WordID) References Word(ID),
          );
        `);
        
      },
      (error) => {
        console.error("Database init error:", error);
        reject(error);
        return false;
      },
      () => {
        console.log("Database initialized");
        resolve();
      }
    );
  });
};

// Article cache service
export const ArticleCacheService = {
  // Save article content to cache
  saveArticle: (logId: number, content: string, title?: string, subtitle?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO article_cache (log_id, content, generated_at, title, subtitle) 
             VALUES (?, ?, ?, ?, ?)`,
            [logId, content, new Date().toISOString(), title || '', subtitle || ''],
            () => resolve(),
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  },

  // Get article content from cache
  getArticle: (logId: number): Promise<{ content: string; title?: string; subtitle?: string; generated_at: string } | null> => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT content, title, subtitle, generated_at FROM article_cache WHERE log_id = ?`,
            [logId],
            (_: any, result: any) => {
              if (result.rows.length > 0) {
                const row = result.rows.item(0);
                resolve({
                  content: row.content,
                  title: row.title,
                  subtitle: row.subtitle,
                  generated_at: row.generated_at
                });
              } else {
                resolve(null);
              }
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  },

  // Check if article exists in cache
  hasArticle: (logId: number): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT COUNT(*) as count FROM article_cache WHERE log_id = ?`,
            [logId],
            (_: any, result: any) => {
              const count = result.rows.item(0).count;
              resolve(count > 0);
            },
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  },

  // Clear article cache
  clearCache: (): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.transaction(
        (tx) => {
          tx.executeSql(
            `DELETE FROM article_cache`,
            [],
            () => resolve(),
            (_: any, error: any) => {
              reject(error);
              return false;
            }
          );
        },
        (error) => reject(error)
      );
    });
  }
};
