import { SummaryProps, sortTimeStrings } from '../utils';

describe('sortTimeStrings', () => {
  const summaries: SummaryProps[] = [
    { group_value: 'demo/with-duration', avg_duration: '00:00:10' },
    { group_value: 'demo/without-duration' },
  ];

  it.each([
    ['asc', ['demo/without-duration', 'demo/with-duration']],
    ['desc', ['demo/with-duration', 'demo/without-duration']],
  ] as const)(
    'sorts missing durations as zero in %s order',
    (direction, expectedGroupValues) => {
      const sorted = sortTimeStrings(summaries, 'avg_duration', direction);

      expect(sorted.map(({ group_value }) => group_value)).toEqual(
        expectedGroupValues,
      );
      expect(summaries.map(({ group_value }) => group_value)).toEqual([
        'demo/with-duration',
        'demo/without-duration',
      ]);
    },
  );
});
