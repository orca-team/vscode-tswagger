import BingTranslate from 'bing-translate-api';
import { capitalize } from 'lodash-es';
import { TranslateEngine } from '../types';
import { setLocalTranslation } from '../utils/localTranslate';

export const translate2EnByBing = async (text: string) => {
  try {
    const result = await BingTranslate.translate(text, null, 'en');
    return result;
  } catch (err) {
    console.error('[BingTranslateAPI translated failed]: ', err);
    throw err;
  }
};

export const formatTranslation = (translation: string) =>
  translation
    .replace(/[^a-zA-Z]/g, ' ')
    .split(' ')
    .filter((text) => !!text)
    .map((text) => capitalize(text))
    .join('');

// TODO: 是否增加多种类型的翻译接口提供选择
const translate = async (text: string, engine: TranslateEngine = 'Bing') => {
  const translation = (await translate2EnByBing(text)).translation;
  const formattedTranslation = formatTranslation(translation);
  setLocalTranslation(text, formattedTranslation);
  return formattedTranslation;
};

export default translate;
