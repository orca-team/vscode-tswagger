import { camelCase } from 'lodash-es';

export const bracesReg = /{(\w+)}/g;

/**
 * 转化 swagger API Path 中的大括号为 ByXXX 的形式，如 /pet/{id}/uploadImage => petByIdUploadImage
 * @param path 路径字符串
 * @returns 过滤大括号后的路径字符串
 */
export const convertAPIPath = (path: string) => (bracesReg.test(path) ? path.replace(bracesReg, (_, pathKey) => camelCase(`by_${pathKey}`)) : path);

/**
 * 组合 API 路径名称
 * @param prefix 前缀
 * @param path 路径字符串
 * @param suffix 后缀
 * @returns 将 API path 组合成一个有效名称
 */
export const composeNameByAPIPath = (prefix: string, path: string, suffix: string = '') =>
  camelCase(
    [prefix]
      .concat(convertAPIPath(path).split('/'))
      .concat(suffix)
      .filter((it) => !!it)
      .join('__'),
  );
