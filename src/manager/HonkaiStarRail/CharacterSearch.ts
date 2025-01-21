import CharacterQuery from './CharacterQuery';
import GameQuery from '../AllGame/GameQuery';

/**
 * 캐릭터 검색 관련 기능을 담당하는 클래스
 */
class CharacterSearch {
  /**
   * 캐릭터 목록을 검색하고 반환하는 메서드
   * @param gameData 게임 정보 객체
   * @returns 캐릭터 목록 검색 결과
   */
  async searchCharacterList(gameData: any) {
    // 게임의 타입(속성, 경로) 정보 조회
    const typeList = await GameQuery.getTypeList(gameData.id);

    // 캐릭터 기본 정보 목록 조회
    const characterList = await CharacterQuery.getCharacterList(gameData.id);

    // 각 캐릭터에 속성과 경로 정보를 매핑
    const mappedCharacters = characterList.map((character: any) => ({
      ...character,
      // 캐릭터의 속성(element) 정보 매핑
      element: typeList.find(
        (type) => Number(type.id) === Number(character?.element),
      ),
      // 캐릭터의 경로(path) 정보 매핑
      path: typeList.find(
        (type) => Number(type.id) === Number(character?.path),
      ),
    }));

    // 결과 반환
    return {
      resultCode: 200,
      items: mappedCharacters,
      resultMsg: 'SUCCESS',
    };
  }

  /**
   * 특정 캐릭터의 상세 정보를 검색하는 메서드
   * @param gameData 게임 정보 객체
   * @param id 캐릭터 ID
   * @returns 캐릭터 상세 정보
   */
  async searchCharacterDetail(gameData: any, id: string) {
    // 캐릭터의 기본 정보 조회
    const characterData = await CharacterQuery.getCharacterDetail(id);
    if (!characterData) {
      throw new Error('Character not found');
    }

    // 캐릭터의 추가 정보(속성, 경로, 스킬, 이미지) 병렬 조회
    const [elementType, pathType, skillData, images] =
      await CharacterQuery.getCharacterAdditionalInfo(
        characterData.element,
        characterData.path,
        id,
      );

    // 캐릭터의 장착 아이템 정보 조회
    const [[cardItems, relicItems, accessoryItems]] = await Promise.all([
      CharacterQuery.getCharacterItems(characterData.info?.itemData),
    ]);

    // 응답 데이터 구성
    const responseData = {
      ...characterData,
      element: elementType,
      path: pathType,
      info: {
        ...characterData.info,
        itemData: {
          card: cardItems,
          relics: relicItems,
          accessories: accessoryItems,
        },
      },
      images,
      skill: skillData,
    };

    // 결과 반환
    return {
      resultCode: 200,
      items: responseData,
      resultMsg: 'SUCCESS',
    };
  }
}

// 싱글톤 인스턴스 생성 및 내보내기
const characterSearch = new CharacterSearch();
export default characterSearch;
