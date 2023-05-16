import { OpenAPIV2 } from 'openapi-types';
import { $REF_LOCAL, $REF_REMOTE, $REF_URL, $RefType } from '../types';
import { hasChinese, splitChineseAndEnglish } from './regexHelpers';
import localTranslate from './localTranslate';
import translate from '../schema2ts/translate';

/**
 * 读取当前 $ref 类型
 * @param $ref $ref
 * @returns $ref 类型
 */
export const $refType = ($ref: string): $RefType => {
  if ($ref.startsWith('#')) {
    return $REF_LOCAL;
  }
  if ($ref.includes('://')) {
    return $REF_URL;
  }

  return $REF_REMOTE;
};

/**
 * 是否为本地引用的 $ref
 * @param $ref $ref
 * @returns boolean
 */
export const isLocal$ref = ($ref: string) => !!$ref && $refType($ref) === $REF_LOCAL;

/**
 * 是否为 OpenAPIV2 版本的引用对象类型
 * @param obj 目标对象
 * @returns boolean
 */
export const isV2RefObject = (obj: any): obj is OpenAPIV2.ReferenceObject => '$ref' in obj;

/**
 * 获取 swagger $ref 中的实体类名称
 * @param $ref 目标 $ref
 * @returns 实体类名称
 */
export const match$RefClassName = ($ref: string) => $ref.split('/').slice(-1)[0] ?? '';

/**
 * 过滤并翻译文本
 * @param text 目标文本
 * @returns 翻译过滤后的文本
 */
export const filterString = async (text: string) => {
  let newString = splitChineseAndEnglish(text) ?? [];

  if (hasChinese(text)) {
    let result = '';
    for (const name of newString) {
      if (hasChinese(name)) {
        const translatedName = localTranslate(name) ?? (await translate(name));
        result += translatedName;
        continue;
      }
      result += name;
    }
    return result;
  }

  return newString?.join('') ?? '';
};
