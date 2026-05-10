import { translate } from '../translate';
import { hasChinese, splitChineseAndEnglish } from './regexHelpers';

export const filterString = async (text: string | string[]): Promise<string> => {
  if (Array.isArray(text)) {
    return Promise.all(text.map((item) => filterString(item))).then((result) => result.join(''));
  }

  const parts = splitChineseAndEnglish(text) ?? [];

  if (hasChinese(text)) {
    let result = '';
    for (const part of parts) {
      result += hasChinese(part) ? await translate(part) : part;
    }
    return result;
  }

  return parts.join('') ?? '';
};