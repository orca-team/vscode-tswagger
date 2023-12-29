import * as vscode from 'vscode';
import { getAllConfiguration, getConfiguration, getGlobalState, setConfiguration } from './utils/vscodeUtil';
import dirTree from 'directory-tree';
import SwaggerParser from '@apidevtools/swagger-parser';
import handleSwaggerPathV2 from './swaggerPath/handleSwaggerPathV2';
import {
  ApiGroupDefNameMapping,
  ApiGroupNameMapping,
  ApiGroupServiceResult,
  GenerateTypescriptConfig,
  RenameMapping,
  ServiceMapInfoYAMLJSONType,
  ServiceResult,
  TSwaggerConfig,
} from './types';
import { OpenAPIV2 } from 'openapi-types';
import { generateServiceFromAPIV2, generateServiceImport, generateTypescriptFromAPIV2 } from './schema2ts/generateTypescript';
import { existsSync, outputFileSync, readFileSync, readdirSync, removeSync, statSync } from 'fs-extra';
import { sendCurrTsGenProgressMsg, sendFetchFileGenMsg } from './serverSentEvents';
import { flatMap, omit } from 'lodash-es';
import templateAxios from './requestTemplates/axios';
import { getGlobalContext } from './globalContext';
import YAML from 'yaml';
import { join } from 'path';
import { currentTime, getConfigJSONPath, getMappedBasePath, getServiceMapJSON, getServiceMapPath, getTSwaggerConfigJSON } from './utils/swaggerUtil';
import { DEFAULT_CONFIG_JSON } from './constants';

export const queryExtInfo = async (context: vscode.ExtensionContext) => {
  const allSetting = getAllConfiguration(['swaggerUrlList']);
  const globalState = getGlobalState(context); // 插件配置
  const config = getTSwaggerConfigJSON();
  return {
    setting: allSetting,
    config,
    globalState,
  };
};

export const queryCwd = async () => {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const treeList: dirTree.DirectoryTree[] = [];
  if (!!workspaceFolders?.length) {
    workspaceFolders.forEach((workspaceFolder) => {
      treeList.push(
        dirTree(workspaceFolder.uri.fsPath, {
          attributes: ['type', 'size'],
          exclude: [/node_modules/, /.git/],
          extensions: /\.(ts|tsx)$/,
        }),
      );
    });
  }

  return treeList;
};

export const parseSwaggerUrl = async (remoteUrl: string) => {
  const apiResponse = await SwaggerParser.parse(remoteUrl);
  console.info('API name: %s, Version: %s', apiResponse.info.title, apiResponse.info.version);
  return apiResponse;
};

export const parseSwaggerJson = async (swaggerJsonStr: string) => {
  const apiResponse = await SwaggerParser.parse(JSON.parse(swaggerJsonStr));
  return apiResponse;
};

export const addSwaggerUrl = async (data: any) => {
  const swaggerUrlList = getConfiguration('swaggerUrlList');
  swaggerUrlList.push(data);
  setConfiguration('swaggerUrlList', swaggerUrlList);
  return swaggerUrlList;
};

export const delSwaggerUrl = async (data: any) => {
  const swaggerUrlList = getConfiguration('swaggerUrlList');
  const newSwaggerUrlList = swaggerUrlList.filter((it: any) => it.key !== data.key && it.url !== data.url);
  setConfiguration('swaggerUrlList', newSwaggerUrlList);
  return newSwaggerUrlList;
};

export const updateSwaggerUrl = async (data: any) => {
  const swaggerUrlList = getConfiguration('swaggerUrlList');
  const targetIndex = swaggerUrlList.findIndex((it: any) => it.key === data.key);
  if (targetIndex > -1) {
    swaggerUrlList[targetIndex] = data;
    setConfiguration('swaggerUrlList', swaggerUrlList);
    return swaggerUrlList;
  }

  return null;
};

const readServiceMappingFile = (config: GenerateTypescriptConfig): RenameMapping => {
  const { V2Document, collection } = config;
  const { basePath } = V2Document;
  const mappedBasePath = getMappedBasePath(basePath);
  const tagList = collection.map((it) => it.tag);

  const renameMapping: RenameMapping = { nameGroup: [], allDefNameMapping: {} };
  const baseTargetPath = getServiceMapPath(mappedBasePath);

  if (!baseTargetPath || !existsSync(baseTargetPath)) {
    return renameMapping;
  }

  tagList.forEach((tag) => {
    const serviceMapFilePath = join(baseTargetPath, tag, 'service.map.yaml');
    if (existsSync(serviceMapFilePath)) {
      const mapYaml = readFileSync(serviceMapFilePath, { encoding: 'utf-8' });
      const mapInfoJSON = YAML.parse(mapYaml) as ServiceMapInfoYAMLJSONType;
      const defNameMapping = mapInfoJSON.defNameMappingList?.find((it) => it.groupName === tag)?.mapping ?? {};
      renameMapping.nameGroup.push({
        groupName: tag,
        group: mapInfoJSON.nameMappingList,
      });
      renameMapping.allDefNameMapping = { ...renameMapping.allDefNameMapping, ...defNameMapping };
    }
  });

  return renameMapping;
};

const mergeDefName = (groupName: string, mapping: Record<string, string>, list: ApiGroupDefNameMapping[]) => {
  const targetIndex = list.findIndex((it) => it.groupName === groupName);
  if (targetIndex > -1) {
    list[targetIndex].mapping = { ...list[targetIndex].mapping, ...mapping };
  } else {
    list.push({ groupName, mapping });
  }
};

export type V2TSGenerateResult = {
  serviceResult: ApiGroupServiceResult[];
  nameMappingList: ApiGroupNameMapping[];
  defNameMappingList: ApiGroupDefNameMapping[];
};

export const generateV2TypeScript = async (webview: vscode.Webview, config: GenerateTypescriptConfig): Promise<V2TSGenerateResult> => {
  // 自动去读工作空间目录下的 mapping 文件
  if (!config.renameMapping) {
    config.renameMapping = readServiceMappingFile(config);
  }
  // 获取配置文件
  const tswaggerConfig = getTSwaggerConfigJSON();

  const { V2Document, options, renameMapping } = config;

  const handleV2ServiceSchemaList = async (tag: string, schemaList?: OpenAPIV2.SchemaObject[], callback: () => void = () => {}) => {
    let tsDefs = '';
    for (const schema of schemaList as OpenAPIV2.SchemaObject[]) {
      const { tsDef: schemaTsDef, defNameMapping } = await generateTypescriptFromAPIV2(schema, V2Document, renameMapping.allDefNameMapping);
      mergeDefName(tag, defNameMapping, defNameMappingList);
      tsDefs += schemaTsDef;
    }

    callback();

    return tsDefs;
  };

  const { swaggerCollection, nameMappingList, associatedDefNameMappingList } = await handleSwaggerPathV2(config);
  const defNameMappingList: ApiGroupDefNameMapping[] = [...associatedDefNameMappingList];
  const serviceResult: ApiGroupServiceResult[] = [];
  const total = flatMap(swaggerCollection.map((it) => it.group)).reduce((prev, curr) => prev + curr.serviceInfoList.length, 0);
  let current = 0;
  for (const { tag, group: swaggerServiceGroup } of swaggerCollection) {
    const result: ServiceResult[] = [];
    for (const groupItem of swaggerServiceGroup) {
      let serviceTsDefs = generateServiceImport([groupItem], tswaggerConfig?.fetchFilePath ?? '');
      const { serviceName, path, method, serviceInfoList } = groupItem;
      // 处理接口出入参
      for (const serviceInfo of serviceInfoList) {
        current++;
        const { type, schemaList } = serviceInfo;
        // 路径参数不参与 ts 的生成，它会在方法参数中进行罗列
        if (type === 'path') {
          sendCurrTsGenProgressMsg(webview, {
            total,
            current,
          });
          continue;
        }
        const serviceInfoDefs = await handleV2ServiceSchemaList(tag, schemaList as OpenAPIV2.SchemaObject[], () => {
          sendCurrTsGenProgressMsg(webview, {
            total,
            current,
          });
        });
        serviceTsDefs += serviceInfoDefs;
      }
      // 生成接口 ts 字符串
      serviceTsDefs += await generateServiceFromAPIV2(groupItem, tswaggerConfig ?? {});
      result.push({
        serviceName,
        path,
        tag,
        method,
        tsDefs: serviceTsDefs,
      });
    }
    serviceResult.push({
      groupName: tag,
      serviceList: result,
    });
  }

  return { serviceResult, nameMappingList, defNameMappingList };
};

export const writeTsFile = async (params: { tsDef: string; outputPath: string }) => {
  const { tsDef, outputPath } = params;

  outputFileSync(outputPath, tsDef, { encoding: 'utf-8' });

  return true;
};

const getServiceMapInfoJSON = (
  swaggerInfo: OpenAPIV2.Document,
  groupName: string,
  nameMappingList: ApiGroupNameMapping[],
  defNameMappingList: ApiGroupDefNameMapping[],
): ServiceMapInfoYAMLJSONType => {
  const { basePath } = swaggerInfo;
  const mappedBasePath = getMappedBasePath(basePath);
  const context = getGlobalContext();
  // 插件版本号
  const tswagger = context.extension.packageJSON.version;
  // 生成时间
  const createTime = currentTime();

  const json: ServiceMapInfoYAMLJSONType = {
    tswagger,
    basePath: mappedBasePath,
    groupName,
    createTime,
    nameMappingList,
    defNameMappingList,
  };

  return json;
};

const mergeServiceMapJSONByGroup = (
  groupResult: ApiGroupServiceResult,
  currentServiceMapJSON: ServiceMapInfoYAMLJSONType,
  mappedBasePath?: string,
): { mergedServiceMapJSON: ServiceMapInfoYAMLJSONType; changedServiceList: string[] } => {
  const { groupName, serviceList } = groupResult;
  const originalServiceMapJSON = getServiceMapJSON(groupName, mappedBasePath);
  const changedServiceList: string[] = [];
  if (!originalServiceMapJSON) {
    return { mergedServiceMapJSON: currentServiceMapJSON, changedServiceList };
  }
  const latestServiceMapInfo = omit(currentServiceMapJSON, ['nameMappingList', 'defNameMappingList']);
  const mergedServiceMapJSON: ServiceMapInfoYAMLJSONType = { ...originalServiceMapJSON, ...latestServiceMapInfo };
  serviceList.forEach((result) => {
    const { path, method } = result;
    const originalNameMappingIndex = originalServiceMapJSON.nameMappingList.findIndex((it) => it.path === path && it.method === method);
    const currentNameMapping = currentServiceMapJSON.nameMappingList.find((it) => it.path === path && it.method === method);
    // 更新 nameMappingList
    if (originalNameMappingIndex > -1) {
      const originalServiceName = originalServiceMapJSON.nameMappingList[originalNameMappingIndex].serviceName!;
      mergedServiceMapJSON.nameMappingList[originalNameMappingIndex] = currentNameMapping!;
      changedServiceList.push(originalServiceName);
    } else {
      mergedServiceMapJSON.nameMappingList.push(currentNameMapping!);
    }
  });

  // 更新 mapping
  mergedServiceMapJSON.defNameMappingList[0].mapping = {
    ...(originalServiceMapJSON.defNameMappingList?.[0].mapping ?? {}),
    ...(currentServiceMapJSON.defNameMappingList?.[0].mapping ?? {}),
  };

  return { mergedServiceMapJSON, changedServiceList };
};

export const checkConfigJSON = async () => {
  const configJSONPath = getConfigJSONPath();

  if (!configJSONPath) {
    return null;
  }

  return existsSync(configJSONPath);
};

export const saveConfigJSON = async (configJSON: TSwaggerConfig) => {
  const configJSONPath = getConfigJSONPath();
  if (!configJSONPath) {
    return null;
  }

  outputFileSync(configJSONPath, JSON.stringify(configJSON, null, 2), { encoding: 'utf-8' });

  return true;
};

// 生成接口入口文件 index.ts
export const generateEntryServiceFile = (targetDir: string) => {
  const serviceFileNameList: string[] = [];
  const entries = readdirSync(targetDir);
  entries.forEach((entry) => {
    const entryPath = join(targetDir, entry);
    if (entry === 'index.ts') {
      return;
    }
    // 检测到 {service}.ts 文件
    if (!statSync(entryPath).isDirectory() && entry.endsWith('.ts')) {
      serviceFileNameList.push(/^(.*)\.ts$/.exec(entry)?.[1]!);
    }
  });
  const serviceIndexContent = serviceFileNameList.map((serviceName) => `export { ${serviceName} } from './${serviceName}.ts';`).join('\n\n') + '\n';
  outputFileSync(join(targetDir, 'index.ts'), serviceIndexContent, { encoding: 'utf-8' });
};

// 生成 ts 文件至项目中，生成路径：src/.tswagger
export const generateV2ServiceFile = async (webview: vscode.Webview, params: { swaggerInfo: OpenAPIV2.Document; data: V2TSGenerateResult }) => {
  const { swaggerInfo, data } = params;
  const { serviceResult, nameMappingList, defNameMappingList } = data;
  // 文档基本信息
  const { basePath } = swaggerInfo;
  const mappedBasePath = getMappedBasePath(basePath);
  // 基本路径
  const baseTargetPath = getServiceMapPath(mappedBasePath);
  if (!baseTargetPath) {
    return null;
  }

  const checkFetchFile = () => {
    const configJSON = getTSwaggerConfigJSON();
    if (configJSON?.fetchFilePath) {
      return;
    }
    const workspaceFolders = vscode.workspace.workspaceFolders;
    // 默认取第一个 (TODO: 多层工作空间)
    const first = workspaceFolders?.[0];
    const fetchPath = first ? join(first.uri.fsPath, '/src/utils/fetch.ts') : '';
    // TODO: 多模板
    const template = templateAxios;
    outputFileSync(fetchPath, template, { encoding: 'utf-8' });
    saveConfigJSON({ ...(configJSON ?? {}), fetchFilePath: DEFAULT_CONFIG_JSON.fetchFilePath });
    sendFetchFileGenMsg(webview, true);
  };

  serviceResult.forEach((result) => {
    const { groupName, serviceList } = result;
    const groupNameMappingList = nameMappingList.filter((it) => it.groupName === groupName);
    const groupDefNameMappingList = defNameMappingList.filter((it) => it.groupName === groupName);
    // 接口名称映射文件
    const currentServiceMapJSON = getServiceMapInfoJSON(swaggerInfo, groupName, groupNameMappingList, groupDefNameMappingList);
    const { mergedServiceMapJSON, changedServiceList } = mergeServiceMapJSONByGroup(result, currentServiceMapJSON, mappedBasePath);
    const mergedServiceMapYaml = YAML.stringify(mergedServiceMapJSON);
    // 名称映射文件
    outputFileSync(join(baseTargetPath, groupName, 'service.map.yaml'), mergedServiceMapYaml, { encoding: 'utf-8' });
    // 删除此次变更的接口文件
    changedServiceList.forEach((originalServiceName) => {
      removeSync(join(baseTargetPath, groupName, `${originalServiceName}.ts`));
    });
    // 写入接口文件
    serviceList.forEach((service) => {
      const { tsDefs, serviceName } = service;
      // 接口文件
      outputFileSync(join(baseTargetPath, groupName, `${serviceName}.ts`), tsDefs, { encoding: 'utf-8' });
    });
    // 生成 index.ts 入口文件
    generateEntryServiceFile(join(baseTargetPath, groupName));
  });

  // 检查是否存在对应的 fetch 文件配置，若没有则自动生成
  checkFetchFile();
};
