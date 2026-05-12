import { camelCase, upperCase } from 'lodash-es';
import { customAlphabet } from 'nanoid';
import { OpenAPIV2 } from 'openapi-types';
import { filterString } from '../utils/filterString';
import { match$RefClassName } from '../utils/swaggerUtil';

export const bracesReg = /{(\w+)}/g;

export const convertAPIPath = (path: string) => (bracesReg.test(path) ? path.replace(bracesReg, (_, pathKey) => camelCase(`by_${pathKey}`)) : path);

export const upperFirstLetter = (text: string) => (text ? `${upperCase(text[0])}${text.slice(1)}` : text);

export const composeNameByAPIPath = (prefix: string, path: string, suffix: string = '') =>
  upperFirstLetter(
    camelCase(
      [prefix]
        .concat(convertAPIPath(path).split('/'))
        .concat(suffix)
        .filter((item) => !!item)
        .join('__'),
    ),
  );

export const getV2RefTargetSchema = async (schema: OpenAPIV2.SchemaObject, V2Document: OpenAPIV2.Document, mapName?: string) => {
  const originRefCls = match$RefClassName(schema.$ref!);
  const schemaName = mapName || (await filterString(originRefCls));
  const refSchema = V2Document.definitions?.[originRefCls.join('')] ?? {};
  refSchema.title = schemaName;

  return { originRefName: originRefCls.join(''), refSchema };
};

const customNanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

export const hashServiceName = (serviceName: string) => {
  const hashValue = customNanoid(5);
  return `${serviceName}_${hashValue}`;
};