export const normalizeWhitespace = (str: string): string => {
  return str.replace(/\s+/g, ' ').trim();
};

export const replaceHyphensAndCapitalize = (str: string): string => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
