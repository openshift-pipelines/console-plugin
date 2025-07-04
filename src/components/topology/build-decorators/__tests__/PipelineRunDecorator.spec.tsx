import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SVGDefsProvider } from '@patternfly/react-topology';
import { useAccessReview } from '@openshift-console/dynamic-plugin-sdk';
import { ConnectedPipelineRunDecorator } from '../PipelineRunDecorator';
import { connectedPipelineOne } from './decorator-data';
import Status from '../../../status/Status';
import {
  getTaskRunsOfPipelineRun,
  useTaskRunsK8s,
} from '../../../hooks/useTaskRuns';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift-console/dynamic-plugin-sdk'),
  useAccessReview: jest.fn(),
  useModal: () => jest.fn(),
  AccessReviewResourceAttributes: {},
}));

jest.mock('../../../start-pipeline/StartPipelineModal', () => () => (
  <div data-testid="mock-start-pipeline-modal">Mocked StartPipelineModal</div>
));

jest.mock('react-dnd', () => ({
  DndProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('react-dnd-html5-backend', () => ({
  NativeTypes: {
    FILE: 'file',
  },
}));

jest.mock('../../../hooks/useTaskRuns', () => ({
  useTaskRunsK8s: jest.fn(),
  getTaskRunsOfPipelineRun: jest.fn(() => []),
}));

jest.mock('../../../utils/common-utils', () => ({
  t: (key: string, params?: Record<string, any>) => {
    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{{${k}}}`, v),
        key,
      );
    }
    return key;
  },
}));

jest.mock('../../../status/Status', () => {
  const mockStatus = jest.fn(() => <div>StatusMock</div>);
  return {
    __esModule: true,
    default: mockStatus,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { changeLanguage: jest.fn() },
  }),
  withTranslation: () => (Component: any) => {
    Component.defaultProps = {
      ...(Component.defaultProps || {}),
      t: (key: string) => key,
    };
    return Component;
  },
}));

describe('ConnectedPipelineRunDecorator (RTL)', () => {
  const mockUseAccessReview = useAccessReview as jest.Mock;
  const mockUseTaskRunsK8s = useTaskRunsK8s as jest.Mock;
  const mockGetTaskRunsOfPipelineRun = getTaskRunsOfPipelineRun as jest.Mock;
  const mockStatus = Status as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccessReview.mockReturnValue(true);
    mockUseTaskRunsK8s.mockReturnValue([[], true]);
    mockGetTaskRunsOfPipelineRun.mockReturnValue([]);
  });

  it('renders a Link when a PipelineRun is available', () => {
    render(
      <MemoryRouter>
        <SVGDefsProvider>
          <ConnectedPipelineRunDecorator
            pipeline={connectedPipelineOne.pipeline}
            pipelineRuns={connectedPipelineOne.pipelineRuns}
            radius={10}
            x={5}
            y={5}
          />
        </SVGDefsProvider>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link');
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).not.toBeNull();
    expect(link.getAttribute('href')).toMatch(/\/logs$/);
  });

  it('renders a clickable bubble when no PipelineRuns but has permission', () => {
    mockStatus.mockImplementationOnce(() => (
      <div aria-label="Pipeline not started">Pipeline not started</div>
    ));

    render(
      <MemoryRouter>
        <SVGDefsProvider>
          <ConnectedPipelineRunDecorator
            pipeline={connectedPipelineOne.pipeline}
            pipelineRuns={[]}
            radius={10}
            x={5}
            y={5}
          />
        </SVGDefsProvider>
      </MemoryRouter>,
    );

    const bubble = screen.getByLabelText(/Pipeline not started/i);
    expect(bubble).toBeDefined();
  });

  it('renders a non-clickable bubble when no PipelineRuns and no permission', () => {
    mockUseAccessReview.mockReturnValue(false);
    mockStatus.mockImplementationOnce(() => (
      <div aria-label="Pipeline not started">Pipeline not started</div>
    ));

    render(
      <MemoryRouter>
        <SVGDefsProvider>
          <ConnectedPipelineRunDecorator
            pipeline={connectedPipelineOne.pipeline}
            pipelineRuns={[]}
            radius={10}
            x={5}
            y={5}
          />
        </SVGDefsProvider>
      </MemoryRouter>,
    );

    const bubble = screen.getByLabelText(/Pipeline not started/i);
    expect(bubble).toBeDefined();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
