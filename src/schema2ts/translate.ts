import { translate as BingTranslate, MET as METTranslate } from 'bing-translate-api';
import { capitalize, pick } from 'lodash-es';
import { currentTranslationEngine, setLocalTranslation } from '../utils/localTranslate';
import { getConfiguration } from '../utils/vscodeUtil';

/**
 * 使用 bing-translate-api 将文本翻译成英文
 * @param text 要翻译的文本
 * @returns 翻译后的文本
 */
export async function translate2EnByBing(text: string) {
  try {
    // 调用 bing-translate-api 将文本翻译成英文
    const result = await BingTranslate(text, null, 'en');
    return result;
  } catch (err) {
    // 如果翻译失败，打印错误信息并抛出异常
    console.error('[BingTranslateAPI translated by Bing failed]: ', err);
    throw err;
  }
}

export async function translate2EnByMET(text: string) {
  try {
    const result = await METTranslate.translate(text, null, 'en');
    return result?.[0]?.translations[0]?.text;
  } catch (err) {
    console.error('[BingTranslateAPI translated by Microsoft failed]: ', err);
    throw err;
  }
}

/**
 * 使用 bing-translate-api 进行翻译
 * @param text - 需要翻译的文本
 * @returns 翻译后的英文文本
 */
export async function translate2EnByPrivateMET(text: string) {
  try {
    const translationConfig = getConfiguration('translation') ?? {};
    // 调用Private Microsoft API进行翻译
    const result = await METTranslate.translate(text, null, 'en', {
      authenticationHeaders: pick(translationConfig, ['Ocp-Apim-Subscription-Key', 'Authorization']),
    });
    // 返回翻译后的英文文本
    return result?.[0]?.translations[0]?.text;
  } catch (err) {
    // 如果翻译失败，打印错误信息并抛出错误
    console.error('[BingTranslateAPI translated by Private Microsoft failed]: ', err);
    throw err;
  }
}

/**
 * 格式化翻译文本
 * @param translation - 待格式化的翻译文本
 * @returns 格式化后的翻译文本
 */
export function formatTranslation(translation: string) {
  // 将非字母字符替换为空格
  return (
    translation
      .replace(/[^a-zA-Z]/g, ' ')
      // 将字符串按空格分割为数组
      .split(' ')
      // 过滤掉空字符串
      .filter((text) => !!text)
      // 将每个单词的首字母大写
      .map((text) => capitalize(text))
      // 将数组拼接为字符串
      .join('')
  );
}

async function translate(text: string) {
  let translation = '';
  const engine = currentTranslationEngine();

  if (engine === 'Bing') {
    translation = (await translate2EnByBing(text))?.translation ?? '';
  }
  if (engine === 'Microsoft') {
    translation = (await translate2EnByMET(text)) ?? '';
  }
  if (engine === 'PrivateMicrosoft') {
    translation = (await translate2EnByPrivateMET(text)) ?? '';
  }
  const formattedTranslation = formatTranslation(translation);
  setLocalTranslation(text, formattedTranslation, engine);

  return formattedTranslation;
}

export default translate;
