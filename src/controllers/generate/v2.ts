import * as vscode from 'vscode';
import YAML from 'yaml';
import { ApiGroupDefNameMapping, ApiGroupNameMapping, ApiGroupServiceResult, GenerateTypescriptConfig, ServiceResult } from '../../types';
import { generateEntryServiceFile, generateServiceMapInfoJSON, mergeServiceMapJSONByGroup, readServiceMappingFile } from './utils';
import { getMappedBasePath, getServiceMapPath, getTSwaggerConfigJSON } from '../../utils/swaggerUtil';
import { OpenAPIV2 } from 'openapi-types';
import { generateServiceFromAPIV2, generateServiceImport, generateTypescriptFromAPIV2 } from '../../schema2ts/generateTypescript';
import { join } from 'path';
import { existsSync, outputFileSync, readFileSync, removeSync } from 'fs-extra';
import handleSwaggerPathV2 from '../../swaggerPath/handleSwaggerPathV2';
import { flatMap } from 'lodash-es';
import { sendCurrTsGenProgressMsg, sendFetchFileGenMsg } from '../../serverSentEvents';
import templateAxios from '../../requestTemplates/axios';
import { saveConfigJSON } from '../common';
import { DEFAULT_CONFIG_JSON } from '../../constants';

export type V2TSGenerateResult = {
  serviceResult: ApiGroupServiceResult[];
  nameMappingList: ApiGroupNameMapping[];
  defNameMappingList: ApiGroupDefNameMapping[];
};

function mergeDefName(groupName: string, mapping: Record<string, string>, list: ApiGroupDefNameMapping[]) {
  const targetIndex = list.findIndex((it) => it.groupName === groupName);
  if (targetIndex > -1) {
    list[targetIndex].mapping = { ...list[targetIndex].mapping, ...mapping };
  } else {
    list.push({ groupName, mapping });
  }
}

/**
 * 生成 OpenAPI2 的 TypeScript 代码
 * @param webview vscode的Webview对象
 * @param config 生成Typescript的配置
 * @returns 返回生成的 OpenAPI2 的 TypeScript 结果
 */
export async function generateV2TypeScript(webview: vscode.Webview, config: GenerateTypescriptConfig): Promise<V2TSGenerateResult> {
  // 自动去读工作空间目录下的 mapping 文件
  if (!config.renameMapping) {
    config.renameMapping = readServiceMappingFile(config);
  }
  // 获取配置文件
  const tswaggerConfig = getTSwaggerConfigJSON();

  const { V2Document, renameMapping } = config;

  /**
   * 处理 OpenAPI2 的Schema数据
   * @param tag 标签
   * @param schemaList Schema对象列表
   * @param callback 回调函数
   * @returns 返回处理后的Schema的Typescript定义
   */
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

  /**
   * 获取本地已保存的 ts 代码
   * @param groupName 组名
   * @param serviceName 服务名
   * @returns 返回本地服务的Typescript定义
   */
  const getLocalServiceTsDefs = (groupName: string, serviceName: string) => {
    const { basePath } = V2Document;
    const mappedBasePath = getMappedBasePath(basePath);
    if (!mappedBasePath) {
      return;
    }
    const targetBasePath = getServiceMapPath(mappedBasePath);
    if (!targetBasePath) {
      return;
    }
    const servicePath = join(targetBasePath, groupName, `${serviceName}.ts`);
    if (!existsSync(servicePath)) {
      return;
    }
    return readFileSync(servicePath, { encoding: 'utf-8' });
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
        localTsDefs: getLocalServiceTsDefs(tag, serviceName),
      });
    }
    serviceResult.push({
      groupName: tag,
      serviceList: result,
    });
  }

  return { serviceResult, nameMappingList, defNameMappingList };
}

/**
 * 生成 ts 文件至项目中，生成路径：src/.tswagger
 * @param webview vscode 的 webview 对象
 * @param params 包含 swaggerInfo 和 data 的对象
 * @returns 生成的 V2 服务文件，若不存在则返回 null
 */
export async function generateV2ServiceFile(webview: vscode.Webview, params: { swaggerInfo: OpenAPIV2.Document; data: V2TSGenerateResult }) {
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
    const currentServiceMapJSON = generateServiceMapInfoJSON(swaggerInfo, groupName, groupNameMappingList, groupDefNameMappingList);
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
}
