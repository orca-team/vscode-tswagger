/**
 * 判断是否含有中文字符
 * @param text 目标字符串
 * @returns boolean
 */
export const hasChinese = (text: string) => /[\u4E00-\u9FFF]+/g.test(text);

/**
 * 将字符串中的中英文给分离出来
 * @param text 目标字符串
 * @returns 由中文或英文组成的字符串数组
 */
export const splitChineseAndEnglish = (text: string) => text.match(/[\u4E00-\u9FA5a-zA-Z]+/g);
