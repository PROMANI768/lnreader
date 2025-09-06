import { ChapterInfo } from '../types';
import { db } from '../db';

// Update chapter progress
export const updateChapterProgress = async (chapterId: number, progress: number): Promise<void> => {
  await db.runAsync(
    'UPDATE Chapter SET progress = ? WHERE id = ?',
    progress,
    chapterId,
  );
};

// Get chapter by ID
export const getChapter = async (chapterId: number): Promise<ChapterInfo | null> => {
  return await db.getFirstAsync<ChapterInfo>(
    'SELECT * FROM Chapter WHERE id = ?',
    chapterId,
  );
};

// Get all chapters for a novel
export const getNovelChapters = async (novelId: number): Promise<ChapterInfo[]> => {
  return await db.getAllAsync<ChapterInfo>(
    'SELECT * FROM Chapter WHERE novelId = ? ORDER BY position ASC',
    novelId,
  );
};

// Mark chapter as read
export const markChapterRead = async (chapterId: number): Promise<void> => {
  await db.runAsync('UPDATE Chapter SET unread = 0 WHERE id = ?', chapterId);
};

// Mark chapter as unread
export const markChapterUnread = async (chapterId: number): Promise<void> => {
  await db.runAsync('UPDATE Chapter SET unread = 1 WHERE id = ?', chapterId);
};

// Get next chapter
export const getNextChapter = async (
  novelId: number,
  chapterPosition: number,
  page: string,
): Promise<ChapterInfo | null> => {
  return await db.getFirstAsync<ChapterInfo>(
    `SELECT * FROM Chapter 
      WHERE novelId = ? 
      AND (
        (page = ? AND position > ?)  
        OR (position = 0 AND page > ?) 
      )
      ORDER BY position ASC, page ASC`,
    novelId,
    page,
    chapterPosition,
    page,
  );
};

// Get previous chapter
export const getPrevChapter = async (
  novelId: number,
  chapterPosition: number,
  page: string,
): Promise<ChapterInfo | null> => {
  return await db.getFirstAsync<ChapterInfo>(
    `SELECT * FROM Chapter 
      WHERE novelId = ? 
      AND (
        (position < ? AND page = ?) 
        OR page < ?
      )
      ORDER BY position DESC, page DESC`,
    novelId,
    chapterPosition,
    page,
    page,
  );
};

// Insert or update chapters
export const insertChapters = async (
  novelId: number,
  chapters: Partial<ChapterInfo>[],
): Promise<void> => {
  if (!chapters?.length) {
    return;
  }

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      await db.runAsync(`
        INSERT INTO Chapter (path, name, releaseTime, novelId, chapterNumber, page, position)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path, novelId) DO UPDATE SET
        page = excluded.page,
        position = excluded.position,
        name = excluded.name,
        releaseTime = excluded.releaseTime,
        chapterNumber = excluded.chapterNumber
      `,
        chapter.path,
        chapter.name || `Chapter ${i + 1}`,
        chapter.releaseTime || '',
        novelId,
        chapter.chapterNumber || null,
        chapter.page || '1',
        i,
      );
    }
  });
};