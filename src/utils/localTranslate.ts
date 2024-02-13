import { getGlobalContext } from '../globalContext';
import { LocalTranslationType, TranslateEngine } from '../types';
import { getConfiguration, getGlobalState, setGlobalState } from './vscodeUtil';

/**
 * 获取当前配置的翻译引擎
 * @returns {TranslateEngine} 当前的翻译引擎
 */
export function currentTranslationEngine(): TranslateEngine {
  // 获取翻译配置
  const translationConfig = getConfiguration('translation') ?? {};

  return translationConfig.engine ?? 'Bing';
}

/**
 * 获取本地翻译
 * @returns {LocalTranslationType[]} 本地翻译集合
 */
export function getLocalTranslation() {
  // 获取全局状态中的本地翻译集合
  const localTranslation = getGlobalState<LocalTranslationType[]>(getGlobalContext(), 'localTranslation');

  // 如果本地翻译集合不存在，则创建一个空数组并设置为全局状态中的本地翻译集合
  if (!localTranslation) {
    setGlobalState(getGlobalContext(), 'localTranslation', []);
    return [];
  }

  // 返回本地翻译集合
  return localTranslation;
}

/**
 * 获取指定引擎的本地翻译
 * @param engine 翻译引擎，默认为'Bing'
 * @returns 返回指定引擎的本地翻译
 */
export function getLocalTranslationByEngine(engine: TranslateEngine = 'Bing') {
  // 获取本地翻译
  const localTranslation = getLocalTranslation();

  // 返回指定引擎的本地翻译
  return localTranslation.find((it) => it.engine === engine);
}

/**
 * 设置本地翻译
 * @param key - 翻译的键
 * @param translation - 翻译的值
 * @param engine - 翻译引擎，默认为'Bing'
 */
export function setLocalTranslation(key: string, translation: string, engine: TranslateEngine = 'Bing') {
  // 获取本地翻译
  const localTranslation = getLocalTranslation();
  // 查找引擎在本地翻译中的索引
  let index = localTranslation.findIndex((it) => it.engine === engine);
  // 如果索引小于0，则将引擎添加到本地翻译中
  if (index < 0) {
    index = localTranslation.length;
    localTranslation.push({
      engine,
      translation: {},
    });
  }
  // 获取引擎对应的本地翻译对象
  let localTranslationByEngine = localTranslation[index];
  // 将翻译键值对添加到引擎对应的本地翻译对象中
  localTranslationByEngine.translation[key] = translation;
  // 更新本地翻译对象
  localTranslation[index] = localTranslationByEngine;

  // 设置全局状态
  setGlobalState(getGlobalContext(), 'localTranslation', localTranslation);
}

/**
 * 本地翻译
 * @param text 要翻译的文本
 * @param engine 翻译引擎，默认为'Bing'
 * @returns 翻译后的文本，如果翻译失败则返回null
 */
function localTranslate(text: string) {
  const engine = currentTranslationEngine();
  // 获取指定引擎的本地翻译
  const localTranslation = getLocalTranslationByEngine(engine);
  // 如果没有找到本地翻译，则返回null
  if (!localTranslation) {
    return null;
  }

  // 返回指定文本的翻译结果
  return localTranslation.translation[text];
}

export default localTranslate;
