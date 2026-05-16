import { translate as bingTranslate } from 'bing-translate-api';
import { hasChinese } from '@tswagger/core';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';

export type TranslatorLogger = Pick<Console, 'warn'>;

export type CreateBingTranslatorOptions = {
  cacheDir?: string;
  cwd?: string;
  disabled?: boolean;
  logger?: TranslatorLogger;
  translateText?: (text: string) => Promise<string>;
};

type TranslationCache = {
  engine: 'Bing';
  translation: Record<string, string>;
};

const DEFAULT_CACHE_DIR = '.tswagger/cli';
const CACHE_FILE_NAME = 'translation-cache.json';

export const formatTranslation = (translation: string): string => {
  return translation
    .replace(/[^a-zA-Z]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((text) => text.slice(0, 1).toUpperCase() + text.slice(1))
    .join('');
};

export const getDefaultCacheFilePath = (cwd: string = process.cwd()): string => {
  return resolve(cwd, DEFAULT_CACHE_DIR, CACHE_FILE_NAME);
};

const readCache = (cacheFilePath: string): TranslationCache => {
  if (!existsSync(cacheFilePath)) {
    return {
      engine: 'Bing',
      translation: {},
    };
  }

  try {
    return JSON.parse(readFileSync(cacheFilePath, 'utf8')) as TranslationCache;
  } catch {
    return {
      engine: 'Bing',
      translation: {},
    };
  }
};

const writeCache = (cacheFilePath: string, cache: TranslationCache): void => {
  mkdirSync(dirname(cacheFilePath), { recursive: true });
  writeFileSync(cacheFilePath, JSON.stringify(cache, null, 2));
};

const defaultTranslateText = async (text: string): Promise<string> => {
  const result = await bingTranslate(text, null, 'en');
  return result?.translation ?? '';
};

export const createBingTranslator = (options: CreateBingTranslatorOptions = {}) => {
  const {
    cacheDir,
    cwd = process.cwd(),
    disabled = false,
    logger = console,
    translateText = defaultTranslateText,
  } = options;

  const cacheFilePath = cacheDir ? resolve(cwd, cacheDir, CACHE_FILE_NAME) : getDefaultCacheFilePath(cwd);
  const cache = readCache(cacheFilePath);

  return {
    cacheFilePath,
    translate: async (text: string): Promise<string> => {
      if (disabled || !hasChinese(text)) {
        return text;
      }

      const cached = cache.translation[text];
      if (cached) {
        return cached;
      }

      try {
        const translation = formatTranslation(await translateText(text));
        if (translation) {
          cache.translation[text] = translation;
          writeCache(cacheFilePath, cache);
          return translation;
        }
      } catch (error) {
        logger.warn(`[tswagger-cli] Bing translation failed for \"${text}\": ${String(error)}`);
      }

      return text;
    },
  };
};