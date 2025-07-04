import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { usePipelineTriggerTemplateNames } from '../../utils/triggers';
import TriggersOverview from '../TriggersOverview';

jest.mock('../../utils/triggers', () => ({
  usePipelineTriggerTemplateNames: jest.fn(),
}));

jest.mock('../TriggerResourceLinks', () => () => (
  <div data-testid="mock-trigger-links">
    <a href="http://devcluster.openshift.com" data-testid="external-url">
      trigger-template-nodejs-ex-jvb0f9
    </a>
  </div>
));

const mockUsePipelineTriggerTemplateNames =
  usePipelineTriggerTemplateNames as jest.Mock;

const sampleTemplateNames = [
  {
    routeURL: 'http://devcluster.openshift.com',
    triggerTemplateName: 'trigger-template-nodejs-ex-jvb0f9',
  },
];

describe('TriggersOverview', () => {
  const pipeline = {
    metadata: { name: 'pipeline', namespace: 'test' },
    spec: { tasks: [] },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not show trigger template and URL when there are no templateNames', () => {
    mockUsePipelineTriggerTemplateNames.mockReturnValue([]);

    render(<TriggersOverview pipeline={pipeline} />);

    expect(screen.queryByTestId('triggers-heading')).toBeNull();
    expect(screen.queryByTestId('triggers-list')).toBeNull();
  });

  it('should show trigger template and URL when available', () => {
    mockUsePipelineTriggerTemplateNames.mockReturnValue(sampleTemplateNames);

    render(<TriggersOverview pipeline={pipeline} />);

    expect(screen.getByText('Triggers')).toBeDefined();
    expect(screen.getByTestId('triggers-list')).toBeDefined();
    expect(screen.getByTestId('triggers-list-item')).toBeDefined();

    // The link title from ResourceLink (via triggerTemplateName)
    expect(
      screen.getByRole('link', { name: /trigger-template-nodejs-ex-jvb0f9/i }),
    ).toBeDefined();

    const externalLink = screen.getByTestId('external-url');
    expect(externalLink.getAttribute('href')).toBe(
      'http://devcluster.openshift.com',
    );
  });
});
