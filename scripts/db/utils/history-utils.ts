// Contains 32 values so that index 0 can be ignored!
// Values are between 0 and 3 will be used to
// 1. add some ups and downs in the PipelineRuns per day
// 2. define the number of failures per day
const dateOfMonth = [
  -1, 1, 0, 2, 0, 2, 3, 1, 2, 0, 3, 2, 1, 2, 3, 2, 0, 1, 1, 2, 0, 3, 0, 1, 2, 0,
  1, 0, 2, 1, 1, 0,
];
console.assert(dateOfMonth.length == 32);

export const getNumberOfPipelinesPerDay = (day: Date) => {
  // increase it over time:
  // -  1 for Jan 2020
  // -  4 for Dec 2020
  // -  8 for Dec 2021
  // - 12 for Dec 2022
  // - 16 for Dec 2023
  const yearAddend = Math.max((day.getFullYear() - 2020) * 4, 0);
  const monthAddend = Math.floor((day.getMonth() + 1) / 4) + 1;
  const dayOfMonthAddend = dateOfMonth[day.getDate()];
  let weekdayFactor = 1;
  if (day.getDay() === 6) weekdayFactor = 0.2; // Saturday
  if (day.getDay() === 0) weekdayFactor = 0.1; // Sunday
  return Math.ceil(
    (yearAddend + monthAddend + dayOfMonthAddend) * weekdayFactor,
  );
};

export const getNumberOfFailuresPerDay = (day: Date) => {
  return dateOfMonth[day.getDate()];
};
