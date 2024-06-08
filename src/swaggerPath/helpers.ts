import { camelCase, upperCase } from 'lodash-es';
import { OpenAPIV2 } from 'openapi-types';
import { filterString, match$RefClassName } from '../utils/swaggerUtil';
import { customAlphabet } from 'nanoid';

export const bracesReg = /{(\w+)}/g;

/**
 * 转化 swagger API Path 中的大括号为 ByXXX 的形式，如 /pet/{id}/uploadImage => petByIdUploadImage
 * @param path 路径字符串
 * @returns 过滤大括号后的路径字符串
 */
export const convertAPIPath = (path: string) => (bracesReg.test(path) ? path.replace(bracesReg, (_, pathKey) => camelCase(`by_${pathKey}`)) : path);

/**
 * 对任意字符串执行首字母大写
 * @param text 目标字符串
 * @returns 首字母大写后的字符串
 */
export const upperFirstLetter = (text: string) => (text ? `${upperCase(text[0])}${text.slice(1)}` : text);

/**
 * 组合 API 路径名称
 * @param prefix 前缀
 * @param path 路径字符串
 * @param suffix 后缀
 * @returns 将 API path 组合成一个有效名称
 */
export const composeNameByAPIPath = (prefix: string, path: string, suffix: string = '') =>
  upperFirstLetter(
    camelCase(
      [prefix]
        .concat(convertAPIPath(path).split('/'))
        .concat(suffix)
        .filter((it) => !!it)
        .join('__'),
    ),
  );

/**
 * 根据 $ref 值获取 OpenAPI2.0 下的实体类名称，并对其映射/过滤处理
 * @param schema
 * @param V2Document
 * @param mapName schema 映射名称
 * @returns ref 对应实体名称 以及 ref 对应的实体类 schema object
 */
export const getV2RefTargetSchema = async (schema: OpenAPIV2.SchemaObject, V2Document: OpenAPIV2.Document, mapName?: string) => {
  const originRefCls = match$RefClassName(schema.$ref!);
  const schemaName = mapName || (await filterString(originRefCls));
  const refSchema = V2Document.definitions?.[originRefCls.join('')] ?? {};
  refSchema.title = schemaName;

  return { originRefName: originRefCls.join(''), refSchema };
};

const customNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

/**
 * 为接口名称生成一个哈希值。
 *
 * @param serviceName 待处理的接口名称。
 * @returns 返回一个新的字符串，由原始接口名称和生成的哈希值组成，两者之间用下划线连接。
 */
export const hashServiceName = (serviceName: string) => {
  // 使用customNanoid函数生成一个长度为5的唯一标识符
  const hashValue = customNanoid(5);
  // 将接口名称和哈希值连接起来形成新的字符串
  return `${serviceName}_${hashValue}`;
};
