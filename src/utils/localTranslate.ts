import { getGlobalContext } from '../globalContext';
import { LocalTranslationType, TranslateEngine } from '../types';
import { getGlobalState, setGlobalState } from './vscodeUtil';

export const getLocalTranslation = () => {
  const localTranslation = getGlobalState<LocalTranslationType[]>(getGlobalContext(), 'localTranslation');

  if (!localTranslation) {
    setGlobalState(getGlobalContext(), 'localTranslation', []);
    return [];
  }

  return localTranslation;
};

export const getLocalTranslationByEngin = (engine: TranslateEngine = 'Bing') => {
  const localTranslation = getLocalTranslation();

  return localTranslation.find((it) => it.engine === 'Bing');
};

export const setLocalTranslation = (key: string, translation: string, engine: TranslateEngine = 'Bing') => {
  const localTranslation = getLocalTranslation();
  let index = localTranslation.findIndex((it) => it.engine === engine);
  if (index < 0) {
    index = localTranslation.length;
    localTranslation.push({
      engine,
      translation: {},
    });
  }
  let localTranslationByEngine = localTranslation[index];
  localTranslationByEngine.translation[key] = translation;
  localTranslation[index] = localTranslationByEngine;

  setGlobalState(getGlobalContext(), 'localTranslation', localTranslation);
};

const localTranslate = (text: string, engine: TranslateEngine = 'Bing') => {
  const localTranslation = getLocalTranslationByEngin(engine);
  if (!localTranslation) {
    return null;
  }

  return localTranslation.translation[text];
};

export default localTranslate;
