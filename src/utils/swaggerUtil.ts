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
 * 收集目标对象中所有的 local $ref 值
 * @param obj 目标对象
 * @param resultSet 结果集
 * @returns 结果集
 */
const collectRefName = <Target extends Object>(obj: Target, resultSet = new Set<string>()) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'object') {
      collectRefName(value, resultSet);
    } else if (key === '$ref' && !!value && isLocal$ref(value!)) {
      resultSet.add(match$RefClassName(value!).join(''));
    }
  });

  return resultSet;
};

/**
 * 收集 schema 中的所有 $ref local 实体
 * @param schema OpenAPIV2 Schema
 * @param defSets 上一次实体类集合
 * @returns 所有本地实体类集合
 */
export const shakeV2RefsInSchema = (schema: OpenAPIV2.SchemaObject, entireDefs: OpenAPIV2.DefinitionsObject) => {
  // 先收集 schema 中的所有 $ref 实体名称
  const schemaRefNameSet = collectRefName(schema);
  // 再根据从 schema 中收集到的实体类对 definitions 进行二次收集
  const defNameSetList = new Set<string>();
  schemaRefNameSet.forEach((ref) => {
    defNameSetList.add(ref);
    const childRefNameSet = collectRefName(entireDefs[ref]);
    childRefNameSet.forEach((childRef) => {
      defNameSetList.add(childRef);
    });
  });

  // $ref tree shaking
  const validDefs: OpenAPIV2.DefinitionsObject = {};
  defNameSetList.forEach((defName) => {
    validDefs[defName] = entireDefs[defName];
  });

  return validDefs;
};

/**
 * 是否为 OpenAPIV2 版本的引用本地对象类型
 * @param obj 目标对象
 * @returns boolean
 */
export const isLocalV2RefObject = (obj: any): obj is OpenAPIV2.ReferenceObject => isLocal$ref(obj.ref) && isV2RefObject(obj);

/**
 * 获取 swagger $ref 中的实体类名称
 * @param $ref 目标 $ref
 * @returns 实体类名称
 */
export const match$RefClassName = ($ref: string) => $ref.split('/').slice(2);

/**
 * 过滤并翻译文本
 * @param text 目标文本
 * @returns 翻译过滤后的文本
 */
export const filterString = async (text: string | string[]): Promise<string> => {
  if (Array.isArray(text)) {
    return Promise.all(text.map((item) => filterString(item))).then((r) => r.join(''));
  }
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

/**
 * 根据 in 给 OpenAPI 2.0 分组
 * @param parameters OpenAPI2.0 给 parameters 按照 in 类型分组
 * @returns 分组结果
 */
export const groupV2Parameters = (parameters: OpenAPIV2.Parameters) => {
  // TODO: 剩余 in 类型处理
  const refParameters = parameters.filter((param) => isV2RefObject(param)) as OpenAPIV2.ReferenceObject[];
  const pathParameters = parameters.filter((param) => !isV2RefObject(param) && param.in === 'path') as OpenAPIV2.Parameter[];
  const queryParameters = parameters.filter((param) => !isV2RefObject(param) && param.in === 'query') as OpenAPIV2.Parameter[];
  const bodyParameter = parameters.find((param) => !isV2RefObject(param) && param.in === 'body') as OpenAPIV2.InBodyParameterObject;

  return {
    refParameters,
    pathParameters,
    queryParameters,
    bodyParameter,
  };
};
