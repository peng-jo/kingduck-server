import axios from 'axios';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export const downloadImage = async (
  url: string,
  directory: string,
  filename: string,
): Promise<void> => {
  try {
    console.log('이미지 다운로드 시작:' + filename);
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    // 이미지 메타데이터 확인
    const image = sharp(response.data);
    const metadata = await image.metadata();

    // 파일 이름에서 확장자를 webp로 변경
    const webpFilename = filename.replace(/\.[^/.]+$/, '.webp');
    const outputPath = path.join(directory, webpFilename);

    if (metadata.format === 'webp') {
      // 이미 webp 형식이면 그대로 저장
      await fs.promises.writeFile(outputPath, response.data);
      console.log('WebP 이미지 저장 완료:', webpFilename);
    } else {
      // webp가 아니면 변환 후 저장
      await sharp(response.data).webp({ quality: 80 }).toFile(outputPath);
      console.log('이미지 변환 및 저장 완료:', webpFilename);
    }
  } catch (error) {
    console.error('이미지 다운로드/변환 실패:', error);
    throw error;
  }
};
