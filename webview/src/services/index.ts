import { SwaggerUrlConfigItem } from '@/utils/types';
import { FetchResult, callService } from '@/utils/vscode';
import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import { ApiGroupNameMapping, GenerateTypescriptConfig, HandleSwaggerPathOptions, SwaggerPathSchemaV2 } from '../../../src/types';
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

export type V2TSGenerateResult = {
  tsDefs: string;
  nameMappingList: ApiGroupNameMapping[];
  allDefNameMapping: Record<string, string>;
};

export const apiGenerateV2TypeScript = async (params: GenerateTypescriptConfig) =>
  callService<FetchResult<V2TSGenerateResult>>('webview-generateV2TypeScript', params);

export const apiWriteTsFile = async (params: { tsDef: string; outputPath: string }) =>
  callService<FetchResult<boolean>>('webview-writeTsFile', params);
