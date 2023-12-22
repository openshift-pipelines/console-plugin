export const toDate = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const toDateTime = (date: Date) => date.toISOString();

export const copyDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const nextDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
