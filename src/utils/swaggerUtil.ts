import { OpenAPIV2 } from 'openapi-types';
import { $REF_LOCAL, $REF_REMOTE, $REF_URL, $RefType, ServiceMapInfoYAMLJSONType, TSwaggerConfig } from '../types';
import { hasChinese, splitChineseAndEnglish } from './regexHelpers';
import localTranslate from './localTranslate';
import translate from '../schema2ts/translate';
import { isObject, uniq } from 'lodash-es';
import { join } from 'path';
import { getCurrentWorkspace } from './vscodeUtil';
import { existsSync, readFileSync, readJSONSync } from 'fs-extra';
import YAML from 'yaml';
import { DEFAULT_CONFIG_JSON } from '../constants';

export const DEFAULT_BASE_PATH_NAME = '_default';

/**
 * 获取接口基本路径名称
 * @param basePath 接口基本路径
 * @returns 基本路径名称
 */
export const getBasePathName = (basePath?: string) =>
  basePath?.startsWith('/') ? basePath?.slice(0) ?? DEFAULT_BASE_PATH_NAME : basePath ?? DEFAULT_BASE_PATH_NAME;

/**
 * 获取当前工作空间 .tswagger 根路径地址
 * @returns .tswagger 根路径
 */
export const getTSwaggerBasePath = () => {
  const workspace = getCurrentWorkspace();
  if (!workspace) {
    return null;
  }
  const tswaggerBasePath = join(workspace.uri.fsPath, 'src/.tswagger');

  return tswaggerBasePath;
};

/**
 * 获取当前工作空间接口 & 映射文件生成地址
 * @param basePath 接口基本路径
 * @returns 当前接口 & 映射文件生成地址
 */
export const getServiceMapPath = (basePath?: string) => {
  const tswaggerBasePath = getTSwaggerBasePath();
  if (!tswaggerBasePath) {
    return null;
  }

  return join(tswaggerBasePath, getBasePathName(basePath));
};

/**
 * 获取对应分组的 service.map.yaml 文件
 * @param groupName 分组名称
 * @param basePath 接口基本路径
 * @returns 对应分组的 service.map.yaml 文件
 */
export const getServiceMapJSON = (groupName: string, basePath?: string) => {
  const baseTargetPath = getServiceMapPath(basePath);
  if (!baseTargetPath) {
    return null;
  }
  const serviceMapFilePath = join(baseTargetPath, groupName, 'service.map.yaml');
  if (!existsSync(serviceMapFilePath)) {
    return null;
  }
  const mapYaml = readFileSync(serviceMapFilePath, { encoding: 'utf-8' });
  const mapInfoJSON = YAML.parse(mapYaml) as ServiceMapInfoYAMLJSONType;

  return mapInfoJSON;
};

export const getConfigJSONPath = () => {
  const tswaggerBasePath = getTSwaggerBasePath();
  if (!tswaggerBasePath) {
    return null;
  }
  const configJSONPath = join(tswaggerBasePath, 'config.json');

  return configJSONPath;
};

/**
 * 获取当前工作空间 tswagger 的配置文件
 * @returns 当前工作空间的 config.json
 */
export const getTSwaggerConfigJSON = (): TSwaggerConfig | null => {
  const configJSONPath = getConfigJSONPath();

  if (!configJSONPath || !existsSync(configJSONPath)) {
    return DEFAULT_CONFIG_JSON;
  }

  const configJSON = readJSONSync(configJSONPath, { encoding: 'utf-8' }) as TSwaggerConfig;
  const mergedConfigJSON = { ...DEFAULT_CONFIG_JSON, ...(configJSON ?? {}) };

  return mergedConfigJSON;
};

const addZero = (value: number) => (value < 10 ? `0${value}` : value);

export const currentTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = addZero(now.getMonth() + 1);
  const day = addZero(now.getDate());
  const hour = addZero(now.getHours());
  const minute = addZero(now.getMinutes());
  const second = addZero(now.getSeconds());

  const dateTime = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

  return dateTime;
};

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

const batchAdd2Set = <Data = any>(set: Set<Data>, ...items: Data[]) => {
  items.forEach((item) => set.add(item));
};

/**
 * 收集目标对象中所有的 local $ref 值
 * @param obj 目标对象
 * @param resultSet 结果集
 * @returns 结果集
 */
const collectRefName = <Target extends Object>(obj: Target, resultSet = new Set<string>()) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (isObject(value)) {
      collectRefName(value, resultSet);
    } else if (key === '$ref' && !!value && isLocal$ref(value!)) {
      resultSet.add(match$RefClassName(value!).join(''));
    }
  });

  return resultSet;
};

type DepDefListItem = string;

/**
 * 递归收集 definitions 中所依赖到的所有实体类
 * @param defQueue 子依赖队列
 * @param entireDefs 完整的 definitions 定义
 * @param resultSet 结果集
 * @returns 结果集
 */
const collectV2AllDepDefs = (defQueue: DepDefListItem[], entireDefs: OpenAPIV2.DefinitionsObject, resultSet = new Set<DepDefListItem>()) => {
  // 去重，减少循环
  defQueue = uniq(defQueue);
  if (!defQueue.length) {
    return;
  }
  const length = defQueue.length;
  new Array(length).fill(0).map(() => {
    const current = defQueue.shift();
    const defList = collectRefName(entireDefs[current!]);
    if (defList.size) {
      batchAdd2Set(resultSet, ...defList);
      defQueue.push(...defList);
    }
  });
  collectV2AllDepDefs(defQueue, entireDefs, resultSet);
};

/**
 * 收集 schema 中的所有 $ref local 实体
 * @param schema OpenAPIV2 Schema
 * @param defSets 上一次实体类集合
 * @returns 所有本地实体类集合
 */
export const shakeV2RefsInSchema = (schema: OpenAPIV2.SchemaObject, entireDefs: OpenAPIV2.DefinitionsObject) => {
  // 先收集 schema 中的所有 $ref 实体名称
  const schemaRefNameSet = collectRefName({ ...schema, definitions: null });
  // 再根据从 schema 中收集到的实体类对 definitions 进行二次收集
  const defNameSet = new Set<string>();
  schemaRefNameSet.forEach((ref) => {
    const childDefSet = collectRefName(entireDefs[ref]);
    collectV2AllDepDefs([...childDefSet], entireDefs, childDefSet);
    batchAdd2Set(defNameSet, ref, ...childDefSet);
  });

  // $ref tree shaking
  const validDefs: OpenAPIV2.DefinitionsObject = {};
  defNameSet.forEach((defName) => {
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
  const formDataParameters = parameters.filter((param) => !isV2RefObject(param) && param.in === 'formData') as OpenAPIV2.Parameter[];
  const bodyParameter = parameters.find((param) => !isV2RefObject(param) && param.in === 'body') as OpenAPIV2.InBodyParameterObject;

  return {
    refParameters,
    pathParameters,
    queryParameters,
    formDataParameters,
    bodyParameter,
  };
};
