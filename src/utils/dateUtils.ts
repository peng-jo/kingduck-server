export const formatDateString = (dateStr: string): string => {
  return new Date(dateStr).toISOString();
};
