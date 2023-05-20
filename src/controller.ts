import * as vscode from 'vscode';
import { getAllConfiguration, getConfiguration, getGlobalState, setConfiguration } from './utils/vscodeUtil';
import dirTree from 'directory-tree';
import SwaggerParser from '@apidevtools/swagger-parser';
import handleSwaggerPathV2 from './swaggerPath/handleSwaggerPathV2';
import { HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from './types';
import { OpenAPIV2 } from 'openapi-types';
import { generateTypescriptFromAPIV2 } from './schema2ts/generateTypescript';
import { writeFileSync } from 'fs';
import { sendCurrTsGenProgressMsg } from './serverSentEvents';

export const queryExtInfo = async (context: vscode.ExtensionContext) => {
  const allSetting = getAllConfiguration(['remoteUrlList']);
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

export const addRemoteUrlList = async (params: { list: any[] }) => {
  const remoteUrlList = getConfiguration('remoteUrlList');
  setConfiguration('remoteUrlList', remoteUrlList.concat(params.list));
  const latestRemoteUrlList = getConfiguration('remoteUrlList') || [];
  return { remoteUrlList: latestRemoteUrlList };
};

export const generateV2TypeScript = async (
  webview: vscode.Webview,
  config: {
    collection: SwaggerPathSchemaV2[];
    V2Document: OpenAPIV2.Document;
    options: Partial<HandleSwaggerPathOptions>;
  },
) => {
  const { V2Document, collection, options } = config;
  let tsDefs = '';
  const schemaCollection = await handleSwaggerPathV2(collection, V2Document, options);
  for (const [index, schema] of schemaCollection.entries()) {
    tsDefs += await generateTypescriptFromAPIV2(schema, V2Document);
    sendCurrTsGenProgressMsg(webview, {
      total: schemaCollection.length,
      current: index,
    });
  }
  return tsDefs;
};

export const writeTsFile = async (params: { tsDef: string; outputPath: string }) => {
  const { tsDef, outputPath } = params;
  writeFileSync(outputPath, tsDef, { encoding: 'utf-8' });

  return true;
};
