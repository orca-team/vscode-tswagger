import { SwaggerPathSchema } from '@/utils/types';
import { FetchResult, callService, postMessage } from '@/utils/vscode';
import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import { HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from '../../../src/types';
import directoryTree from 'directory-tree';

const webviewService = {
  /**
   * 获取插件配置/全局状态等信息
   */
  queryExtInfo: () => {
    postMessage({
      method: 'webview-queryExtInfo',
      params: {},
    });
  },

  /**
   * 获取当前用户工作空间目录
   */
  queryCWD: () => {
    postMessage({
      method: 'webview-queryCWD',
      params: {},
    });
  },

  /**
   * 根据 swagger 远程接口获取 schema 解析结果
   */
  querySwaggerSchema: (remoteUrl: string) => {
    postMessage({
      method: 'webview-querySwaggerSchema',
      params: {
        url: remoteUrl,
      },
    });
  },

  /**
   * 生成 OpenAPI2 的 ts 类型定义
   */
  generateAPIV2Ts: (
    collection: SwaggerPathSchema[],
    outputPath: string,
    V2Document?: OpenAPIV2.Document,
    outputOptions?: Partial<HandleSwaggerPathOptions>,
  ) => {
    postMessage({
      method: 'webview-generateAPIV2Ts',
      params: {
        collection,
        V2Document,
        outputPath,
        outputOptions,
      },
    });
  },
};

export default webviewService;

export const apiQueryExtInfo = async () => callService<FetchResult<any>>('webview-queryExtInfo');

export const apiQueryCwd = async () => callService<FetchResult<directoryTree.DirectoryTree[]>>('webview-queryCwd');

export const apiAddRemoteUrl = async (params: { list: any[] }) => callService<FetchResult<boolean>>('webview-addRemoteUrl', params);

export const apiParseSwaggerUrl = async (remoteUrl: string) => callService<FetchResult<OpenAPI.Document>>('webview-parseSwaggerUrl', remoteUrl);

export const apiParseSwaggerJson = async (swaggerJson: string) =>
  callService<FetchResult<OpenAPIV2.Document>>('webview-parseSwaggerJson', swaggerJson);

export const apiGenerateV2TypeScript = async (params: {
  collection: SwaggerPathSchemaV2[];
  V2Document: OpenAPIV2.Document;
  options: Partial<HandleSwaggerPathOptions>;
}) => callService<FetchResult<string>>('webview-generateV2TypeScript', params);

export const apiWriteTsFile = async (params: { tsDef: string; outputPath: string }) =>
  callService<FetchResult<boolean>>('webview-writeTsFile', params);
