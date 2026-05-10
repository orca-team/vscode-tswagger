export * from './schema2ts/buildSchema';
export * from './schema2ts/constants';
export * from './schema2ts/convertSwagger';
export * from './schema2ts/generateTypescript';
export * from './swaggerPath/handleSwaggerPathV2';
export { default as handleSwaggerPathV2 } from './swaggerPath/handleSwaggerPathV2';
export * from './swaggerPath/helpers';
export * from './swaggerPath/types';
export * from './utils/filterString';
export * from './utils/regexHelpers';
export * from './utils/swaggerUtil';

import { setTranslate } from './translate';

export type CoreConfig = {
  translate: (text: string) => Promise<string>;
};

export const configure = (config: CoreConfig): void => {
  setTranslate(config.translate);
};