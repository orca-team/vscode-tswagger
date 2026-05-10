import { translate as BingTranslate, MET as METTranslate } from 'bing-translate-api';
import { LocalTranslationType, TranslateEngine } from '@tswagger/types';
import { capitalize, pick } from 'lodash-es';
import * as vscode from 'vscode';
import { hasChinese } from '@tswagger/core';
import { getGlobalContext } from '../globalContext';
import { getConfiguration, getGlobalState, setGlobalState } from './vscodeUtil';

export function currentTranslationEngine(): TranslateEngine {
  const translationConfig = getConfiguration('translation') ?? {};

  return translationConfig.engine ?? 'Bing';
}

export function getLocalTranslation(context: vscode.ExtensionContext = getGlobalContext()) {
  const localTranslation = getGlobalState<LocalTranslationType[]>(context, 'localTranslation');

  if (!localTranslation) {
    setGlobalState(context, 'localTranslation', []);
    return [];
  }

  return localTranslation;
}

export function getLocalTranslationByEngine(engine: TranslateEngine = 'Bing', context: vscode.ExtensionContext = getGlobalContext()) {
  return getLocalTranslation(context).find((item) => item.engine === engine);
}

export function setLocalTranslation(
  key: string,
  translation: string,
  engine: TranslateEngine = 'Bing',
  context: vscode.ExtensionContext = getGlobalContext(),
) {
  const localTranslation = getLocalTranslation(context);
  let index = localTranslation.findIndex((item) => item.engine === engine);
  if (index < 0) {
    index = localTranslation.length;
    localTranslation.push({
      engine,
      translation: {},
    });
  }

  const localTranslationByEngine = localTranslation[index];
  localTranslationByEngine.translation[key] = translation;
  localTranslation[index] = localTranslationByEngine;

  setGlobalState(context, 'localTranslation', localTranslation);
}

export function localTranslate(text: string, context: vscode.ExtensionContext = getGlobalContext()) {
  const engine = currentTranslationEngine();
  const localTranslation = getLocalTranslationByEngine(engine, context);
  if (!localTranslation) {
    return null;
  }

  return localTranslation.translation[text];
}

export async function translate2EnByBing(text: string) {
  try {
    return await BingTranslate(text, null, 'en');
  } catch (error) {
    console.error('[BingTranslateAPI translated by Bing failed]: ', error);
    throw error;
  }
}

export async function translate2EnByMET(text: string) {
  try {
    const result = await METTranslate.translate(text, null, 'en');
    return result?.[0]?.translations[0]?.text;
  } catch (error) {
    console.error('[BingTranslateAPI translated by Microsoft failed]: ', error);
    throw error;
  }
}

export async function translate2EnByPrivateMET(text: string) {
  try {
    const translationConfig = getConfiguration('translation') ?? {};
    const result = await METTranslate.translate(text, null, 'en', {
      authenticationHeaders: pick(translationConfig, ['Ocp-Apim-Subscription-Key', 'Authorization']),
    });
    return result?.[0]?.translations[0]?.text;
  } catch (error) {
    console.error('[BingTranslateAPI translated by Private Microsoft failed]: ', error);
    throw error;
  }
}

export function formatTranslation(translation: string) {
  return translation
    .replace(/[^a-zA-Z]/g, ' ')
    .split(' ')
    .filter((text) => !!text)
    .map((text) => capitalize(text))
    .join('');
}

async function translateWithEngine(text: string) {
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

  return {
    engine,
    translation: formatTranslation(translation),
  };
}

export function createTranslateFunction(context: vscode.ExtensionContext) {
  return async (text: string): Promise<string> => {
    if (!hasChinese(text)) {
      return text;
    }

    const cached = localTranslate(text, context);
    if (cached) {
      return cached;
    }

    const { engine, translation } = await translateWithEngine(text);
    if (translation) {
      setLocalTranslation(text, translation, engine, context);
    }

    return translation || text;
  };
}