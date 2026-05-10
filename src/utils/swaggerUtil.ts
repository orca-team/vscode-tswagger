import { ServiceMapInfoYAMLJSONType, TSwaggerConfig } from '@tswagger/types';
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

  return configJSON ?? {};
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
 * 获取映射后的文档路径前缀
 * @param basePath 原文档路径前缀
 * @returns 映射后的路径前缀
 */
export const getMappedBasePath = (basePath?: string) => {
  const tswaggerConfig = getTSwaggerConfigJSON();
  const mappedBasePath = basePath ? tswaggerConfig?.basePathMapping?.[basePath] ?? basePath : basePath;

  return mappedBasePath;
};
