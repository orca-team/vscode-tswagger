import { ApiGroupDefNameMapping } from '../../../src/types';

/**
 * 粘贴至剪切板
 * @param text 粘贴文本
 */
export const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

// collect all def in group
export const collectAllDefNameMapping = (group: ApiGroupDefNameMapping[]) => {
  let allDefNameMapping: Record<string, string> = {};
  group.forEach(({ mapping }) => {
    allDefNameMapping = { ...allDefNameMapping, ...mapping };
  });

  return allDefNameMapping;
};
