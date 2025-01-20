import youtubedl from 'youtube-dl-exec';
import fs from 'fs';
import path from 'path';

export const downloadVideo = async (
  url: string,
  outputPath: string,
): Promise<void> => {
  await youtubedl(url, {
    output: outputPath,
  });
};

export const youtubeVideo = async (
  searchTerm: string,
): Promise<string | null> => {
  try {
    // YouTube 검색 및 다운로드 로직 구현
    return null;
  } catch (error) {
    console.error('YouTube 비디오 처리 실패:', error);
    return null;
  }
};
