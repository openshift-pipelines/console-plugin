import { SummaryProps, doesNamespaceExists, sortTimeStrings } from '../utils';

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
