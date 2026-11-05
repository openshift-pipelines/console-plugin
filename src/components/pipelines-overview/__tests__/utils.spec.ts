import {
  SummaryProps,
  doesNamespaceExists,
  getSuccessRate,
  sortByNumbers,
  sortBySuccessRate,
  sortTimeStrings,
} from '../utils';

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

describe('sortBySuccessRate', () => {
  const summaries: SummaryProps[] = [
    { group_value: 'demo/full-success', succeeded: 1, total: 1 },
    { group_value: 'demo/low-success', succeeded: 20, total: 100 },
    { group_value: 'demo/half-success', succeeded: 2, total: 4 },
  ];

  it.each([
    ['asc', ['demo/low-success', 'demo/half-success', 'demo/full-success']],
    ['desc', ['demo/full-success', 'demo/half-success', 'demo/low-success']],
  ] as const)(
    'sorts by displayed success rate in %s order',
    (direction, expected) => {
      const sorted = sortBySuccessRate(summaries, direction);

      expect(sorted.map(({ group_value }) => group_value)).toEqual(expected);
      expect(sorted.map(getSuccessRate)).toEqual(
        direction === 'asc' ? [20, 50, 100] : [100, 50, 20],
      );
      expect(summaries.map(({ group_value }) => group_value)).toEqual([
        'demo/full-success',
        'demo/low-success',
        'demo/half-success',
      ]);
    },
  );

  it('treats missing values and a zero total as a zero success rate', () => {
    const sorted = sortBySuccessRate(
      [
        { group_value: 'demo/half-success', succeeded: 1, total: 2 },
        { group_value: 'demo/no-runs', total: 0 },
        { group_value: 'demo/missing-values' },
      ],
      'asc',
    );

    expect(sorted.map(getSuccessRate)).toEqual([0, 0, 50]);
  });
});

describe('sortByNumbers', () => {
  it('sorts positive numbers in descending order', () => {
    const sorted = sortByNumbers(
      [
        { group_value: 'demo/three', succeeded: 3 },
        { group_value: 'demo/one', succeeded: 1 },
        { group_value: 'demo/two', succeeded: 2 },
      ],
      'succeeded',
      'desc',
    );

    expect(sorted.map(({ succeeded }) => succeeded)).toEqual([3, 2, 1]);
  });

  it.each([
    ['asc', ['demo/zero', 'demo/three', 'demo/missing']],
    ['desc', ['demo/three', 'demo/zero', 'demo/missing']],
  ] as const)(
    'sorts missing values last in %s order',
    (direction, expected) => {
      const sorted = sortByNumbers(
        [
          { group_value: 'demo/missing' },
          { group_value: 'demo/zero', succeeded: 0 },
          { group_value: 'demo/three', succeeded: 3 },
        ],
        'succeeded',
        direction,
      );

      expect(sorted.map(({ group_value }) => group_value)).toEqual(expected);
    },
  );
});

describe('doesNamespaceExists', () => {
  const projects = [
    { metadata: { name: 'ns-1' } },
    { metadata: { name: 'ns-2' } },
  ];

  it('should return false when projects are not loaded', () => {
    expect(
      doesNamespaceExists({ projectsLoaded: false, projects }, 'ns-1'),
    ).toBe(false);
  });

  it('should return false when rowData is undefined', () => {
    expect(doesNamespaceExists(undefined, 'ns-1')).toBe(false);
  });

  it('should return false when projectsLoaded is missing', () => {
    expect(doesNamespaceExists({ projects }, 'ns-1')).toBe(false);
  });

  it('should return true when the namespace exists in projects', () => {
    expect(
      doesNamespaceExists({ projectsLoaded: true, projects }, 'ns-1'),
    ).toBe(true);
  });

  it('should return false when the namespace does not exist in projects', () => {
    expect(
      doesNamespaceExists({ projectsLoaded: true, projects }, 'deleted-ns'),
    ).toBe(false);
  });

  it('should return false when projects is empty', () => {
    expect(
      doesNamespaceExists({ projectsLoaded: true, projects: [] }, 'ns-1'),
    ).toBe(false);
  });

  it('should return false when projects is undefined even if loaded', () => {
    expect(doesNamespaceExists({ projectsLoaded: true }, 'ns-1')).toBe(false);
  });

  it('should ignore projects without metadata name', () => {
    expect(
      doesNamespaceExists(
        {
          projectsLoaded: true,
          projects: [{ metadata: {} }, { metadata: { name: 'ns-1' } }],
        },
        'ns-1',
      ),
    ).toBe(true);
    expect(
      doesNamespaceExists(
        {
          projectsLoaded: true,
          projects: [{ metadata: {} }, null],
        },
        'ns-1',
      ),
    ).toBe(false);
  });
});
