import { SwaggerUrlConfigItem } from '@/utils/types';
import { FetchResult, callService } from '@/utils/vscode';
import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import { GenerateTypescriptConfig, TSwaggerConfig } from '../../../src/types';
import { V2TSGenerateResult } from '../../../src/controllers';
import directoryTree from 'directory-tree';

export const apiQueryExtInfo = async () => callService<FetchResult<any>>('webview-queryExtInfo');

export const apiQueryCwd = async () => callService<FetchResult<directoryTree.DirectoryTree[]>>('webview-queryCwd');

export const apiAddSwaggerUrl = async (data: SwaggerUrlConfigItem) => callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-addSwaggerUrl', data);

export const apiDelSwaggerUrl = async (data: SwaggerUrlConfigItem) => callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-delSwaggerUrl', data);

export const apiUpdateSwaggerUrl = async (data: SwaggerUrlConfigItem) =>
  callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-updateSwaggerUrl', data);

export const apiParseSwaggerUrl = async (remoteUrl: string) => callService<FetchResult<OpenAPI.Document>>('webview-parseSwaggerUrl', remoteUrl);

export const apiParseSwaggerJson = async (swaggerJson: string) =>
  callService<FetchResult<OpenAPIV2.Document>>('webview-parseSwaggerJson', swaggerJson);

export const apiGenerateV2TypeScript = async (params: GenerateTypescriptConfig) =>
  callService<FetchResult<V2TSGenerateResult>>('webview-generateV2TypeScript', params);

export const apiWriteTsFile = async (params: { tsDef: string; outputPath: string }) =>
  callService<FetchResult<boolean>>('webview-writeTsFile', params);

// 生成接口文件
export const apiGenerateV2ServiceFile = async (params: { swaggerInfo: OpenAPIV2.Document; data: V2TSGenerateResult }) =>
  callService<FetchResult>('webview-generateV2ServiceFile', params);

// 检查配置文件
export const apiCheckConfigJSON = async () => callService<FetchResult<boolean | null>>('webview-checkConfigJSON');

// 写入配置文件
export const apiSaveConfigJSON = async (configJSON: TSwaggerConfig) => callService<FetchResult<boolean | null>>('webview-saveConfigJSON', configJSON);
