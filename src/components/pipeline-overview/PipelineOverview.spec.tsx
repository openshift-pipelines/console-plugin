import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { setPipelineNotStarted } from './pipeline-overview-utils';
import PipelinesOverview from './PipelineOverview';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ResourceLink: (props: any) => (
    <div data-testid="resource-link">Mock ResourceLink - {props.name}</div>
  ),
  getGroupVersionKindForModel: () => ({}),
}));

jest.mock('./PipelineOverviewAlert', () => (props: any) => (
  <div data-testid="pipeline-overview-alert">Mock Alert - {props.title}</div>
));

jest.mock('./PipelineStartButton', () => () => (
  <div data-testid="pipeline-start-button">Mock Start Button</div>
));

jest.mock('./TriggerLastRunButton', () => () => (
  <div data-testid="trigger-last-run-button">Mock Trigger Last Run Button</div>
));

jest.mock('./PipelineRunItem', () => (props: any) => (
  <div data-testid="pipeline-run-item">
    Mock Run - {props.pipelineRun?.metadata?.name}
  </div>
));

jest.mock('./TriggersOverview', () => () => (
  <div data-testid="triggers-overview">Mock Triggers Overview</div>
));

describe('Pipeline sidebar overview', () => {
  let props: React.ComponentProps<typeof PipelinesOverview>;

  beforeEach(() => {
    props = {
      item: {
        obj: {},
        pipelines: [
          {
            metadata: { name: 'pipeline', namespace: 'test' },
            spec: { tasks: [] },
          },
        ],
        pipelineRuns: [],
      },
    };
    sessionStorage.clear();
  });

  it('should show view all link if there are more than MAX_VISIBLE pipelineruns', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2', 'pr3'].map((pr) => ({
      metadata: { name: pr, namespace: 'test', uid: pr },
      spec: {},
    }));

    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(
      screen.getByText((content) => content.startsWith('View all')),
    ).toBeDefined();
  });

  it('should not show view all link if there are exactly MAX_VISIBLE pipelineruns', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2'].map((pr) => ({
      metadata: { name: pr, namespace: 'test', uid: pr },
      spec: {},
    }));

    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.queryByText(/View all/)).toBeNull();
  });

  it('should show Start button when no pipelineruns are available', () => {
    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('pipeline-start-button')).toBeDefined();
  });

  it('should show Start last run button when pipelineruns are available', () => {
    props.item.pipelineRuns = [
      {
        metadata: { name: 'pipelinerun', namespace: 'test', uid: 'test' },
        spec: {},
      },
    ];

    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('trigger-last-run-button')).toBeDefined();
  });

  it('should show the pipeline not started Alert', () => {
    const { name, namespace } = props.item.pipelines[0].metadata;
    setPipelineNotStarted(name, namespace);

    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('pipeline-overview-alert')).toBeDefined();
  });

  it('should not show the pipeline not started Alert', () => {
    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('pipeline-overview-alert')).toBeNull();
  });

  it('should render up to MAX_VISIBLE PipelineRunItems', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2', 'pr3'].map((pr) => ({
      metadata: { name: pr, namespace: 'test', uid: pr },
      spec: {},
    }));

    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.getAllByTestId('pipeline-run-item')).toHaveLength(3);
  });

  it('should render TriggersOverview', () => {
    render(
      <MemoryRouter>
        <PipelinesOverview {...props} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('triggers-overview')).toBeDefined();
  });
});
