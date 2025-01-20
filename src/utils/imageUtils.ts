import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const downloadImage = async (
  url: string,
  directory: string,
  filename: string,
): Promise<void> => {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    fs.writeFileSync(path.join(directory, filename), response.data);
  } catch (error) {
    console.error('이미지 다운로드 실패:', error);
  }
};
