import { OpenAPIV2 } from 'openapi-types';
import { ApiGroupByTag, ApiPathType } from './types';
import { HttpMethod } from '../../../src/types';

export const parseOpenAPIV2 = (doc: OpenAPIV2.Document) => {
  // 相同 tag 名称的 api 集合映射
  const apiMapByTag = new Map<string, ApiPathType[]>();
  //  tag 名称与 tag 信息的映射
  const tagInfoMap = new Map<string, OpenAPIV2.TagObject>();
  const { tags = [], paths = {} } = doc;

  tags.forEach((tag) => {
    apiMapByTag.set(tag.name, []);
    tagInfoMap.set(tag.name, tag);
  });

  Object.entries(paths).forEach(([apiPath, apiPathItem]) => {
    Object.entries(apiPathItem).forEach(([method, pathInfo]) => {
      const { tags: currentTags = [] } = pathInfo as OpenAPIV2.OperationObject;
      currentTags.forEach((currentTag) => {
        if (!apiMapByTag.has(currentTag)) {
          apiMapByTag.set(currentTag, []);
          tagInfoMap.set(currentTag, {
            name: currentTag,
          });
        }
        const groupPath = apiMapByTag.get(currentTag) ?? [];
        groupPath.push({
          method: method as HttpMethod,
          path: apiPath,
          pathInfo: pathInfo as OpenAPIV2.OperationObject,
        });
      });
    });
  });

  const apiGroup: ApiGroupByTag[] = [];

  for (const [tagName, pathGroup] of apiMapByTag) {
    apiGroup.push({
      tag: tagInfoMap.get(tagName) as OpenAPIV2.TagObject,
      apiPathList: pathGroup,
    });
  }

  return apiGroup;
};
