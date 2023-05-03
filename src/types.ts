export type GlobalStateKey = 'localTranslation';

export type TranslateEngine = 'Bing';

export type LocalTranslationMap = Record<string, string>;

export type LocalTranslationType = {
  engine: TranslateEngine;
  translation: LocalTranslationMap;
};
