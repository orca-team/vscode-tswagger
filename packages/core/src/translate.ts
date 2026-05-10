let translateFn: (text: string) => Promise<string> = async (text) => text;

export const setTranslate = (fn: (text: string) => Promise<string>): void => {
  translateFn = fn;
};

export const translate = (text: string): Promise<string> => translateFn(text);