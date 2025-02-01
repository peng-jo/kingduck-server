import GameQuery from '../AllGame/GameQuery';

/**
 * 캐릭터 검색 관련 기능을 담당하는 클래스
 */
class NikkeCharacterSearch {
  // 나무위키 소녀전선2 캐릭터 리스트 처리
  async ListNamuWikiSearch(page: any) {
    try {
      // 본문 내용 추출
      const references = await page.evaluate(() => {
        const referenceElements = Array.from(
          document.querySelectorAll(
            'table[style="width:100%; border:2px solid #010101;"]',
          ),
        )
          .map((tr) => {
            const tds = tr.querySelectorAll('td[colspan="2"]');
            const contentItem = tds[0].querySelectorAll('div > div > dl ');
            const contentText = Array.from(contentItem).map((item) => {
              const dt = item.querySelector('dt');
              const dd = item.querySelector('dd');
              if (dt?.textContent?.includes('버스트')) {
                const characterListSelected =
                  dd?.querySelectorAll('div.SGcNubhZ > div');
                const characterList = Array.from(characterListSelected).map(
                  (item) => {
                    const tableList = item.querySelector(
                      'table > tbody > tr dl.yD8tVqU6',
                    );
                    const dataTitle = tableList?.querySelector('dt');
                    const dataTable = tableList?.querySelectorAll('dd');
                    const dataTableRow = Array.from(dataTable).map((item) => {
                      const aElements = item.querySelectorAll('a');
                      const aTexts = Array.from(aElements).map((a) => ({
                        text: a.textContent?.trim() || '',
                        href: a.getAttribute('href') || '',
                      }));
                      return aTexts;
                    });
                    return {
                      title: dataTitle?.textContent?.trim() || '',
                      content: dataTableRow[0] || '',
                    };
                  },
                );
                return {
                  title: dt?.textContent?.trim() || '',
                  content: characterList,
                };
              }
              return;
            });
            return contentText;
          })
          .filter((item) => item !== null);
        return {
          referenceElements,
        };
      });
      return references;
    } catch (error) {
      console.error('데이터 추출 중 오류:', error);
      throw error;
    }
  }
}

export default new NikkeCharacterSearch();
