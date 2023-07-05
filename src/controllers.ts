import * as vscode from 'vscode';
import { getAllConfiguration, getConfiguration, getGlobalState, setConfiguration } from './utils/vscodeUtil';
import dirTree from 'directory-tree';
import SwaggerParser from '@apidevtools/swagger-parser';
import handleSwaggerPathV2 from './swaggerPath/handleSwaggerPathV2';
import { GenerateTypescriptConfig } from './types';
import { OpenAPIV2 } from 'openapi-types';
import { generateServiceFromAPIV2, generateServiceImport, generateTypescriptFromAPIV2 } from './schema2ts/generateTypescript';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { sendCurrTsGenProgressMsg } from './serverSentEvents';
import { flatMap } from 'lodash-es';
import templateAxios from './requestTemplates/axios';

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

export const generateV2TypeScript = async (webview: vscode.Webview, config: GenerateTypescriptConfig) => {
  const { V2Document, options, renameMapping } = config;

  let tsDefs = '';
  const { swaggerCollection, nameMappingList, associatedDefNameMapping } = await handleSwaggerPathV2(config);
  let currentDefNameMapping: Record<string, string> = { ...associatedDefNameMapping };
  const schemaCollection = flatMap(swaggerCollection.map((it) => it.schemaList ?? [])) as OpenAPIV2.SchemaObject[];
  const serviceCollection = swaggerCollection.filter((it) => it.type === 'service');
  const total = schemaCollection.length + serviceCollection.length;
  let current = 0;
  for (const schema of schemaCollection) {
    current++;
    const { tsDef: schemaTsDef, defNameMapping } = await generateTypescriptFromAPIV2(schema, V2Document, renameMapping?.allDefNameMapping);
    currentDefNameMapping = { ...currentDefNameMapping, ...defNameMapping };
    tsDefs += schemaTsDef;
    sendCurrTsGenProgressMsg(webview, {
      total,
      current,
    });
  }

  const workspaceFolders = vscode.workspace.workspaceFolders;
  // 默认取第一个 (TODO: 多层工作空间)
  const first = workspaceFolders?.[0];
  // TODO: 配置化 & 消息推送
  const fetchDir = first ? `${first.uri.fsPath}/src/utils` : '';
  const fetchPath = first ? `${first.uri.fsPath}/src/utils/fetch.ts` : '';
  if (options.service && first && !existsSync(fetchPath)) {
    // TODO: 多模板
    const template = templateAxios;
    !existsSync(fetchDir) && mkdirSync(fetchDir, { recursive: true });
    writeFileSync(fetchPath, template, { encoding: 'utf-8' });
  }

  if (options.service) {
    tsDefs = (await generateServiceImport(serviceCollection.map((it) => it.serviceInfoMap!))) + tsDefs;
  }

  // 临时：将接口全部放在参数定义下方
  for (const service of serviceCollection) {
    current++;
    tsDefs += await generateServiceFromAPIV2(service.serviceInfoMap!);
  }

  return { tsDefs, nameMappingList, allDefNameMapping: currentDefNameMapping };
};

export const writeTsFile = async (params: { tsDef: string; outputPath: string }) => {
  const { tsDef, outputPath } = params;
  writeFileSync(outputPath, tsDef, { encoding: 'utf-8' });

  return true;
};
