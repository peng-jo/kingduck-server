export class StringUtils {
  // 공백(160)을 일반 공백(32)으로 변환하는 함수
  static normalizeWhitespace(str: string): string {
    const nonBreakingSpace = '\u00A0'; // 유니코드 160
    const regularSpace = ' '; // 유니코드 32
    return str.split(nonBreakingSpace).join(regularSpace);
  }

  // prydwen 날짜 정보 변환을 위한 함수
  static formatDateString(dateString: string): string {
    console.log(dateString);

    // "th", "st", "nd", "rd" 등의 접미사를 제거합니다.
    const cleanedDateString = dateString.replace(/(st|nd|rd|th)/g, '');
    // Date 객체로 변환합니다.
    const dateObject = new Date(cleanedDateString);
    // 날짜 형식을 'YYYY-MM-DD'로 변환합니다.
    const formattedDate = dateObject.toISOString().split('T')[0];
    return formattedDate;
  }

  // 하이픈을 띄어쓰기로 치환하고 각 단어의 첫 글자를 대문자로 변환하는 함수
  static replaceHyphensAndCapitalize(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
