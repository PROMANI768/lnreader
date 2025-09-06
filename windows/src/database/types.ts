export interface ChapterInfo {
  id: number;
  novelId: number;
  path: string;
  name: string;
  releaseTime?: string;
  bookmark: number;
  unread: number;
  readTime?: string;
  isDownloaded: number;
  updatedTime?: string;
  chapterNumber?: number;
  page: string;
  position: number;
  progress?: number;
}

export interface NovelInfo {
  id: number;
  name: string;
  path: string;
  pluginId: string;
  cover?: string;
  summary?: string;
  author?: string;
  artist?: string;
  status?: string;
  genres?: string;
  inLibrary: number;
  unread: number;
  lastRead?: string;
  lastUpdate?: string;
  chaptersDownloaded: number;
  chaptersUnread: number;
  totalChapters: number;
  lastReadAt?: string;
  lastUpdatedAt?: string;
}

export interface CategoryInfo {
  id: number;
  name: string;
  sort: number;
}

export interface RepositoryInfo {
  url: string;
  name: string;
  lang?: string;
}

export interface DownloadedChapter extends ChapterInfo {
  pluginId: string;
  novelName: string;
  novelCover?: string;
  novelPath: string;
}

export interface UpdateOverview {
  novelId: number;
  novelName: string;
  novelCover?: string;
  novelPath: string;
  updateDate: string;
  updatesPerDay: number;
}

export interface Update extends ChapterInfo {
  pluginId: string;
  novelName: string;
  novelCover?: string;
  novelPath: string;
}