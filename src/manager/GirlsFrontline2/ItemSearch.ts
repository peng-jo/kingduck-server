/**
 * 아이템 검색 관련 기능을 담당하는 클래스
 */
class GirlsFrontline2ItemSearch {
  // 받은 브라우저 정보에서 아이템 정보를 추출
  async NamuWikiSearch(page: any) {
    try {
      // 본문 내용 추출
      const references = await page.evaluate(() => {
        const referenceElements = Array.from(
          document.querySelectorAll('table._c0af6be787ae13fc570bbb300af0f619'),
        )
          .map((table) => {
            try {
              const trs = Array.from(table.querySelectorAll('tr'));
              const item = trs.map((tr) => {
                try {
                  const tdList = Array.from(tr.querySelectorAll('td'));
                  if (tdList.length >= 2) {
                    const title = tdList[0]?.textContent?.trim();
                    const info = Array.from(
                      tr.querySelectorAll('td div[style*="float:right"]'),
                    ).length;
                    const engraving = Array.from(
                      tr.querySelectorAll('td div>strong>a'),
                    ).length;
                    if (info == 0 && engraving == 0) {
                      const value = tdList[1]?.textContent?.trim();
                      return { title, value };
                    } else if (engraving > 0) {
                      const engravingDivs = Array.from(
                        tdList[1].querySelectorAll('td div>strong:first-child'),
                      );
                      const parentElements = engravingDivs.map((div) => {
                        const aText = div.textContent?.trim() || '';
                        const parentElement = div.parentElement?.parentElement;
                        const fullText =
                          parentElement?.textContent?.trim() || '';
                        const otherText = fullText.replace(aText, '').trim();
                        return {
                          aTagText: aText,
                          remainText: otherText,
                        };
                      });
                      return { title, value: parentElements };
                    } else {
                      const rightDivs = Array.from(
                        tdList[1].querySelectorAll(
                          'td div[style*="float:right"]',
                        ),
                      );
                      const parentElements = rightDivs.map((div) => {
                        const rightText = div.textContent?.trim() || '';
                        const parentElement = div.parentElement;
                        const fullText =
                          parentElement?.textContent?.trim() || '';
                        const leftText = fullText.replace(rightText, '').trim();
                        return {
                          left: leftText,
                          right: rightText,
                        };
                      });
                      return { title, value: parentElements };
                    }
                  } else {
                    return { value: tdList[0].textContent?.trim() };
                  }
                } catch (err: unknown) {
                  return 'error: table._c0af6be787ae13fc570bbb300af0f619>tr>item';
                }
              });
              return item;
            } catch (err) {
              return 'error: table._c0af6be787ae13fc570bbb300af0f619>tr';
            }
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
export default new GirlsFrontline2ItemSearch();
