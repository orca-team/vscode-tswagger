import YAML from 'yaml';
import { existsSync, outputFileSync, readFileSync, readdirSync, statSync } from 'fs-extra';
import {
  ApiGroupDefNameMapping,
  ApiGroupNameMapping,
  ApiGroupServiceResult,
  GenerateTypescriptConfig,
  RenameMapping,
  ServiceMapInfoYAMLJSONType,
} from '../../types';
import { currentTime, getMappedBasePath, getServiceMapJSON, getServiceMapPath } from '../../utils/swaggerUtil';
import { join } from 'path';
import { OpenAPIV2 } from 'openapi-types';
import { getGlobalContext } from '../../globalContext';
import { omit } from 'lodash-es';

/**
 * 读取工作空间目录下的 mapping 文件
 * @param config 生成 TypeScript 的配置对象
 * @returns 重命名映射对象
 */
export function readServiceMappingFile(config: GenerateTypescriptConfig): RenameMapping {
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
}

/**
 * 生成 service.map.yaml 文件 JSON 数据
 * @param swaggerInfo Swagger信息
 * @param groupName 组名
 * @param nameMappingList API组名映射列表
 * @param defNameMappingList API组定义名映射列表
 * @returns service.map.yaml JSON
 */
export function generateServiceMapInfoJSON(
  swaggerInfo: OpenAPIV2.Document,
  groupName: string,
  nameMappingList: ApiGroupNameMapping[],
  defNameMappingList: ApiGroupDefNameMapping[],
): ServiceMapInfoYAMLJSONType {
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
}

/**
 * 根据分组合并 service.map.yaml 数据
 * @param groupResult 分组结果
 * @param currentServiceMapJSON 当前服务映射JSON
 * @param mappedBasePath 映射的基础路径（可选）
 * @returns mergedServiceMapJSON-合并后的数据；changedServiceList-本次变更的接口列表
 */
export function mergeServiceMapJSONByGroup(
  groupResult: ApiGroupServiceResult,
  currentServiceMapJSON: ServiceMapInfoYAMLJSONType,
  mappedBasePath?: string,
): { mergedServiceMapJSON: ServiceMapInfoYAMLJSONType; changedServiceList: string[] } {
  // 获取分组名称和服务列表
  const { groupName, serviceList } = groupResult;
  // 获取原始服务映射JSON
  const originalServiceMapJSON = getServiceMapJSON(groupName, mappedBasePath);
  // 初始化发生变化的接口列表
  const changedServiceList: string[] = [];
  // 如果原始服务映射JSON不存在，则直接返回当前服务映射JSON和空的变更接口列表
  if (!originalServiceMapJSON) {
    return { mergedServiceMapJSON: currentServiceMapJSON, changedServiceList };
  }
  // 获取最新服务映射信息（不包含nameMappingList和defNameMappingList）
  const latestServiceMapInfo = omit(currentServiceMapJSON, ['nameMappingList', 'defNameMappingList']);
  // 合并服务映射JSON（将最新服务映射信息与原始服务映射JSON合并）
  const mergedServiceMapJSON: ServiceMapInfoYAMLJSONType = { ...originalServiceMapJSON, ...latestServiceMapInfo };
  serviceList.forEach((result) => {
    const { path, method } = result;
    const originalNameMappingIndex = originalServiceMapJSON.nameMappingList.findIndex((it) => it.path === path && it.method === method);
    const currentNameMapping = currentServiceMapJSON.nameMappingList.find((it) => it.path === path && it.method === method);
    // 如果原始接口名称存在，则更新nameMappingList
    if (originalNameMappingIndex > -1) {
      const originalServiceName = originalServiceMapJSON.nameMappingList[originalNameMappingIndex].serviceName!;
      mergedServiceMapJSON.nameMappingList[originalNameMappingIndex] = currentNameMapping!;
      changedServiceList.push(originalServiceName);
    } else {
      mergedServiceMapJSON.nameMappingList.push(currentNameMapping!);
    }
  });

  // 更新mapping
  mergedServiceMapJSON.defNameMappingList[0].mapping = {
    ...(originalServiceMapJSON.defNameMappingList?.[0].mapping ?? {}),
    ...(currentServiceMapJSON.defNameMappingList?.[0].mapping ?? {}),
  };

  return { mergedServiceMapJSON, changedServiceList };
}

/**
 * 生成接口入口文件 index.ts
 * @param targetDir 目标目录
 */
export function generateEntryServiceFile(targetDir: string) {
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
  const serviceIndexContent = serviceFileNameList.map((serviceName) => `export { ${serviceName} } from './${serviceName}';`).join('\n\n') + '\n';
  outputFileSync(join(targetDir, 'index.ts'), serviceIndexContent, { encoding: 'utf-8' });
}
