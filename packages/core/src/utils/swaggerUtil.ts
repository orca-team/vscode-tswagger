import { $RefType } from '@tswagger/types';
import { isObject } from 'lodash-es';
import { OpenAPIV2 } from 'openapi-types';

export const $REF_LOCAL = '$REF_LOCAL' as const;
export const $REF_URL = '$REF_URL' as const;
export const $REF_REMOTE = '$REF_REMOTE' as const;

export const $refType = ($ref: string): $RefType => {
  if ($ref.startsWith('#')) {
    return $REF_LOCAL;
  }
  if ($ref.includes('://')) {
    return $REF_URL;
  }

  return $REF_REMOTE;
};

export const isLocal$ref = ($ref: string) => !!$ref && $refType($ref) === $REF_LOCAL;

export const isV2RefObject = (obj: any): obj is OpenAPIV2.ReferenceObject => '$ref' in obj;

const batchAdd2Set = <Data = any>(set: Set<Data>, ...items: Data[]) => {
  items.forEach((item) => set.add(item));
};

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

const collectV2AllDepDefs = (
  initialDeps: DepDefListItem[],
  entireDefs: OpenAPIV2.DefinitionsObject,
  maxDepth: number = 50,
): Set<DepDefListItem> => {
  const resultSet = new Set<DepDefListItem>();
  const queue: DepDefListItem[] = [...initialDeps];
  const visited = new Set<string>();
  let currentDepth = 0;

  while (queue.length > 0 && currentDepth < maxDepth) {
    const batchSize = queue.length;
    let processedInBatch = 0;

    for (let index = 0; index < batchSize; index++) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }

      visited.add(current);
      resultSet.add(current);
      processedInBatch++;

      if (entireDefs[current]) {
        const dependencies = collectRefName(entireDefs[current]);
        dependencies.forEach((dependency) => {
          if (!visited.has(dependency) && !queue.includes(dependency)) {
            queue.push(dependency);
          }
        });
      }
    }

    currentDepth++;

    if (processedInBatch === 0) {
      break;
    }
  }

  if (currentDepth >= maxDepth && queue.length > 0) {
    console.warn(`[collectV2AllDepDefs] 达到最大深度限制 ${maxDepth}，可能存在过深的嵌套或循环依赖。剩余未处理的依赖: ${queue.length}`);
  }

  return resultSet;
};

export const shakeV2RefsInSchema = (schema: OpenAPIV2.SchemaObject, entireDefs: OpenAPIV2.DefinitionsObject) => {
  const schemaRefNameSet = collectRefName({ ...schema, definitions: null });
  const defNameSet = new Set<string>();
  schemaRefNameSet.forEach((ref) => {
    const childDefSet = collectRefName(entireDefs[ref]);
    const allChildDeps = collectV2AllDepDefs([...childDefSet], entireDefs);
    batchAdd2Set(defNameSet, ref, ...allChildDeps);
  });

  const validDefs: OpenAPIV2.DefinitionsObject = {};
  defNameSet.forEach((defName) => {
    validDefs[defName] = entireDefs[defName];
  });

  return validDefs;
};

export const isLocalV2RefObject = (obj: any): obj is OpenAPIV2.ReferenceObject => isLocal$ref(obj.ref) && isV2RefObject(obj);

export const match$RefClassName = ($ref: string) => [$ref.slice($ref.indexOf('/', $ref.indexOf('/') + 1) + 1)];

export const groupV2Parameters = (parameters: OpenAPIV2.Parameters) => {
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