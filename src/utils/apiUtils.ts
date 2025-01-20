import axios from 'axios';

export const fetchData = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};

export const fetchPageConfig = async (url: string) => {
  const response = await axios.get(url);
  return response.data.pageConfig;
};
