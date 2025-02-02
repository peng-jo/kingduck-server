interface SSRSkill {
  name: string;
  type: string;
  burst: string;
  manufacturer: string;
  element: string;
  weapon: string;
  skillType: string;
  skillCategory: string;
  skillName: string;
  target: string;
  effect: string;
  additionalTarget?: string;
  additionalEffect?: string;
}

function parseCSVtoJSON(csvData: string): SSRSkill[] {
  const lines = csvData.split('\n');
  const skills: SSRSkill[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 쉼표로 분리하되, 큰따옴표로 묶인 내용은 하나의 필드로 처리
    const columns = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    // 필수 필드가 없으면 건너뛰기
    if (columns.length < 10) continue;

    try {
      const skill: SSRSkill = {
        name: columns[0]?.replace(/"/g, '').trim() || '',
        type: columns[1]?.replace(/"/g, '').trim() || '',
        burst: columns[2]?.replace(/"/g, '').trim() || '',
        manufacturer: columns[3]?.replace(/"/g, '').trim() || '',
        element: columns[4]?.replace(/"/g, '').trim() || '',
        weapon: columns[5]?.replace(/"/g, '').trim() || '',
        skillType: columns[6]?.replace(/"/g, '').trim() || '',
        skillCategory: columns[7]?.replace(/"/g, '').trim() || '',
        skillName: columns[8]?.replace(/"/g, '').trim() || '',
        target: columns[9]?.replace(/"/g, '').trim() || '',
        effect: columns[10]?.replace(/"/g, '').trim() || '',
        additionalTarget: columns[11]?.replace(/"/g, '').trim() || '',
        additionalEffect: columns[12]?.replace(/"/g, '').trim() || '',
      };

      // 필수 필드가 있는 경우만 추가
      if (skill.name && skill.type) {
        skills.push(skill);
      }
    } catch (error) {
      console.error(`Error parsing line ${i + 1}:`, line);
      continue; // 에러가 발생한 라인은 건너뛰고 계속 진행
    }
  }

  return skills;
}

// CSV 파일을 읽어서 JSON으로 변환하는 함수
async function convertSSRSkillList(): Promise<SSRSkill[]> {
  try {
    const fs = require('fs');
    const path = require('path');

    const csvPath = path.join(__dirname, 'setJson', 'SSRSkillList.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');

    const skillList = parseCSVtoJSON(csvData);

    // JSON 파일로 저장 (선택사항)
    const jsonPath = path.join(__dirname, 'setJson', 'SSRSkillList.json');
    fs.writeFileSync(jsonPath, JSON.stringify(skillList, null, 2));

    return skillList;
  } catch (error) {
    console.error('Error converting CSV to JSON:', error);
    throw error;
  }
}

export { SSRSkill, convertSSRSkillList };
