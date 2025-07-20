import { SwaggerUrlConfigItem } from '@/utils/types';
import { FetchResult, callService } from '@/utils/vscode';
import { OpenAPI, OpenAPIV2 } from 'openapi-types';
import { GenerateTypescriptConfig, LocalTranslationType, ServiceMapInfoYAMLJSONType, TSwaggerConfig } from '../../../src/types';
import { V2TSGenerateResult } from '../../../src/controllers/generate/v2';
import directoryTree from 'directory-tree';
import { ExtTranslationConfig } from '@/states/globalState';

export const apiQueryExtInfo = async () => callService<FetchResult<any>>('webview-queryExtInfo');

export const apiQueryLocalTranslation = async () => callService<FetchResult<LocalTranslationType[]>>('webview-queryLocalTranslation');

export const apiUpdateTranslationConfig = async (data: ExtTranslationConfig) =>
  callService<FetchResult<void>>('webview-updateTranslationConfig', data);

export const apiQueryCwd = async () => callService<FetchResult<directoryTree.DirectoryTree[]>>('webview-queryCwd');

export const apiAddSwaggerUrl = async (data: SwaggerUrlConfigItem) => callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-addSwaggerUrl', data);

export const apiDelSwaggerUrl = async (data: SwaggerUrlConfigItem) => callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-delSwaggerUrl', data);

export const apiUpdateSwaggerUrl = async (data: SwaggerUrlConfigItem) =>
  callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-updateSwaggerUrl', data);

export const apiUpdateSwaggerUrlList = async (list: SwaggerUrlConfigItem[]) =>
  callService<FetchResult<SwaggerUrlConfigItem[]>>('webview-updateSwaggerUrlList', list);

export const apiParseSwaggerUrl = async (remoteUrl: string) => callService<FetchResult<OpenAPI.Document>>('webview-parseSwaggerUrl', remoteUrl);

export const apiParseSwaggerJson = async (swaggerJson: string) =>
  callService<FetchResult<OpenAPIV2.Document>>('webview-parseSwaggerJson', swaggerJson);

// ==================== 分组文档相关 API ====================

export const apiAddGroupSwaggerDoc = async (data: any) => 
  callService<FetchResult<any>>('webview-addGroupSwaggerDoc', data);

export const apiDelGroupSwaggerDoc = async (data: any) => 
  callService<FetchResult<any>>('webview-delGroupSwaggerDoc', data);

export const apiUpdateGroupSwaggerDoc = async (data: any) => 
  callService<FetchResult<any>>('webview-updateGroupSwaggerDoc', data);

export const apiUpdateSwaggerDocGroup = async (data: any) => 
  callService<FetchResult<any>>('webview-updateSwaggerDocGroup', data);

export const apiUpdateGroupSwaggerDocList = async (list: any[]) => 
  callService<FetchResult<any>>('webview-updateGroupSwaggerDocList', list);

export const apiCreateSwaggerDocGroup = async (data: any) => 
  callService<FetchResult<any>>('webview-createSwaggerDocGroup', data);

export const apiDeleteSwaggerDocGroup = async (groupId: string) => 
  callService<FetchResult<any>>('webview-deleteSwaggerDocGroup', groupId);

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

// 读取本地对应分组下的 service.map.yaml 文件
export const apiReadServiceMapInfo = async (params: { mappedBasePath: string; groupNameList: string[] }) =>
  callService<FetchResult<ServiceMapInfoYAMLJSONType[]>>('webview-readLocalServiceInfo', params);
