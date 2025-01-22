/**
 * 문자열의 공백 문자를 정규화하는 함수
 * @param str 정규화할 문자열
 * @param setType 1: 유니코드160 -> 32 변환, 2: 유니코드32 -> 160 변환
 * @returns 정규화된 문자열
 */
export function normalizeWhitespace(str: string, setType: number = 1): string {
  const UNICODE_160 = '\u00A0'; // 줄바꿈 없는 공백
  const UNICODE_32 = ' '; // 일반 공백

  // 연속된 공백을 하나로 정규화
  let normalized = str.replace(/\s+/g, ' ');

  switch (setType) {
    case 1:
      // 유니코드 160을 32로 변환
      normalized = normalized.split(UNICODE_160).join(UNICODE_32);
      break;
    case 2:
      // 유니코드 32를 160으로 변환
      normalized = normalized.split(UNICODE_32).join(UNICODE_160);
      break;
  }

  return normalized.trim(); // 앞뒤 공백 제거
}

/**
 * 하이픈을 공백으로 변환하고 단어의 첫 글자를 대문자로 변환하는 함수
 * @param str 변환할 문자열
 * @returns 변환된 문자열
 */
export function replaceHyphensAndCapitalize(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
