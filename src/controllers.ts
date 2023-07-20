import * as vscode from 'vscode';
import { getAllConfiguration, getConfiguration, getGlobalState, setConfiguration } from './utils/vscodeUtil';
import dirTree from 'directory-tree';
import SwaggerParser from '@apidevtools/swagger-parser';
import handleSwaggerPathV2 from './swaggerPath/handleSwaggerPathV2';
import { ApiGroupDefNameMapping, ApiGroupNameMapping, GenerateTypescriptConfig, RenameMapping, ServiceMapInfoYAMLJSONType } from './types';
import { OpenAPIV2 } from 'openapi-types';
import { generateServiceFromAPIV2, generateServiceImport, generateTypescriptFromAPIV2 } from './schema2ts/generateTypescript';
import { existsSync, outputFileSync, pathExistsSync, readFileSync } from 'fs-extra';
import { sendCurrTsGenProgressMsg } from './serverSentEvents';
import { flatMap, isArray, uniq } from 'lodash-es';
import templateAxios from './requestTemplates/axios';
import { getGlobalContext } from './globalContext';
import YAML from 'yaml';
import { join } from 'path';
import { currentTime, getServiceMapPath } from './utils/swaggerUtil';

export const queryExtInfo = async (context: vscode.ExtensionContext) => {
  const allSetting = getAllConfiguration(['swaggerUrlList']);
  const globalState = getGlobalState(context);
  return {
    setting: allSetting,
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
  const newSwaggerUrlList = swaggerUrlList.filter((it: any) => it.id !== data.id && it.url !== data.url);
  setConfiguration('swaggerUrlList', newSwaggerUrlList);
  return newSwaggerUrlList;
};

export const updateSwaggerUrl = async (data: any) => {
  const swaggerUrlList = getConfiguration('swaggerUrlList');
  const targetIndex = swaggerUrlList.findIndex((it: any) => it.id === data.id && it.url === data.url);
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
  const tagList = collection.map((it) => it.tag);

  const renameMapping: RenameMapping = { nameGroup: [], allDefNameMapping: {} };
  const baseTargetPath = getServiceMapPath(basePath);

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
  tsDefs: string;
  nameMappingList: ApiGroupNameMapping[];
  defNameMappingList: ApiGroupDefNameMapping[];
};

export const generateV2TypeScript = async (webview: vscode.Webview, config: GenerateTypescriptConfig): Promise<V2TSGenerateResult> => {
  // 自动去读工作空间目录下的 mapping 文件
  if (!config.renameMapping) {
    config.renameMapping = readServiceMappingFile(config);
  }

  const { V2Document, options, renameMapping } = config;

  let tsDefs = '';
  const { swaggerCollection, nameMappingList, associatedDefNameMappingList } = await handleSwaggerPathV2(config);
  const defNameMappingList: ApiGroupDefNameMapping[] = [...associatedDefNameMappingList];
  const schemaCollection = flatMap(swaggerCollection.map((it) => it.schemaList ?? [])) as OpenAPIV2.SchemaObject[];
  const serviceCollection = swaggerCollection.filter((it) => it.type === 'service');
  const total = schemaCollection.length + serviceCollection.length;
  let current = 0;
  for (const collection of swaggerCollection) {
    const { schemaList, tag } = collection;
    if (isArray(schemaList)) {
      for (const schema of schemaList as OpenAPIV2.SchemaObject[]) {
        current++;
        const { tsDef: schemaTsDef, defNameMapping } = await generateTypescriptFromAPIV2(schema, V2Document, renameMapping.allDefNameMapping);
        mergeDefName(tag, defNameMapping, defNameMappingList);
        tsDefs += schemaTsDef;
        sendCurrTsGenProgressMsg(webview, {
          total,
          current,
        });
      }
    }
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  // 默认取第一个 (TODO: 多层工作空间)
  const first = workspaceFolders?.[0];
  // TODO: 配置化 & 消息推送
  const fetchPath = first ? join(first.uri.fsPath, '/src/utils/fetch.ts') : '';
  if (options.service && first && !pathExistsSync(fetchPath)) {
    // TODO: 多模板
    const template = templateAxios;
    outputFileSync(fetchPath, template, { encoding: 'utf-8' });
  }

  if (options.service) {
    tsDefs = (await generateServiceImport(serviceCollection.map((it) => it.serviceInfoMap!))) + tsDefs;
  }

  // 临时：将接口全部放在参数定义下方
  for (const service of serviceCollection) {
    current++;
    tsDefs += await generateServiceFromAPIV2(service.serviceInfoMap!);
  }

  return { tsDefs, nameMappingList, defNameMappingList };
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
  const context = getGlobalContext();
  // 插件版本号
  const extVersion = context.extension.packageJSON.version;
  // 生成时间
  const createTime = currentTime();

  const json: ServiceMapInfoYAMLJSONType = {
    extVersion,
    basePath,
    groupName,
    createTime,
    nameMappingList,
    defNameMappingList,
  };

  return json;
};

// 生成 ts 文件至项目中，生成路径：src/.tswagger
export const generateV2ServiceFile = async (params: { swaggerInfo: OpenAPIV2.Document; data: V2TSGenerateResult }) => {
  const { swaggerInfo, data } = params;
  const { tsDefs, nameMappingList, defNameMappingList } = data;
  // 文档基本信息
  const { basePath } = swaggerInfo;
  // 基本路径
  const baseTargetPath = getServiceMapPath(basePath);
  if (!baseTargetPath) {
    return null;
  }

  const groupNameList = uniq(nameMappingList.map((it) => it.groupName));

  groupNameList.forEach((groupName) => {
    const groupNameMappingList = nameMappingList.filter((it) => it.groupName === groupName);
    const groupDefNameMappingList = defNameMappingList.filter((it) => it.groupName === groupName);
    // 接口名称映射文件
    const serviceMapJSON = getServiceMapInfoJSON(swaggerInfo, groupName, groupNameMappingList, groupDefNameMappingList);
    const serviceMapYaml = YAML.stringify(serviceMapJSON);
    // 名称映射文件
    outputFileSync(join(baseTargetPath, groupName, 'service.map.yaml'), serviceMapYaml, { encoding: 'utf-8' });
    // 接口文件
    outputFileSync(join(baseTargetPath, groupName, 'service.ts'), tsDefs, { encoding: 'utf-8' });
  });
};
