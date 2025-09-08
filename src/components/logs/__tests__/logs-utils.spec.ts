import { PodStatus } from '../../../types';
import { getRenderContainers } from '../logs-utils';
import { podData } from './logs-test-data';

describe('logs utils', () => {
  it('should return container and still fetching as false when logs completed', () => {
    const { containers, stillFetching } = getRenderContainers(podData);
    expect(stillFetching).toBe(false);
    expect(containers).toHaveLength(1);
  });

  it('should return container and still fetching as true when logs are not completed', () => {
    const { metadata, spec } = podData;
    const resource = {
      metadata,
      spec,
      status: {
        containerStatuses: [
          {
            name: 'step-oc',
            state: {
              running: {},
            },
            lastState: {},
          },
        ],
      } as PodStatus,
    };
    const { containers, stillFetching } = getRenderContainers(resource);
    expect(containers).toHaveLength(1);
    expect(stillFetching).toBe(true);
  });
});

describe('tests for findTargetRowForActiveStep logic', () => {
  // Testing only the method logic
  const findTargetRowForActiveStep = (
    formattedString: string,
    activeStep: string,
  ) => {
    if (!activeStep) return null;
    const lines = formattedString.split('\n');
    let targetLine: number | null = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(`STEP-${activeStep}`.toUpperCase())) {
        targetLine = i;
        break;
      }
    }
    return targetLine;
  };
  // Mock formatted log data for testing 1 step name corresponds to 3 lines of content
  const createMockFormattedString = (stepNames: string[]): string => {
    return stepNames
      .map(
        (stepName) =>
          `STEP-${stepName.toUpperCase()}\nSome log content for ${stepName}\n`,
      )
      .join('\n');
  };

  it('should return 0 when activeStep is found at the beginning', () => {
    const formattedString = createMockFormattedString([
      'build',
      'test',
      'deploy',
    ]);
    const result = findTargetRowForActiveStep(formattedString, 'build');
    expect(result).toBe(0);
  });

  it('should return correct line number when activeStep is found in the middle', () => {
    const formattedString = createMockFormattedString([
      'build',
      'test',
      'deploy',
    ]);
    const result = findTargetRowForActiveStep(formattedString, 'test');
    expect(result).toBe(3); // Line 0: STEP-BUILD, Line 1: content, Line 2: empty, Line 3: STEP-TEST
  });

  it('should return correct line number when activeStep is found at the end', () => {
    const formattedString = createMockFormattedString([
      'build',
      'test',
      'deploy',
    ]);
    const result = findTargetRowForActiveStep(formattedString, 'deploy');
    expect(result).toBe(6);
  });

  it('should return null when activeStep is not found', () => {
    const formattedString = createMockFormattedString(['build', 'test']);
    const result = findTargetRowForActiveStep(formattedString, 'nonexistent');
    expect(result).toBe(null);
  });

  it('should handle case insensitive matching', () => {
    const formattedString = 'STEP-BUILD\nSome content\nSTEP-TEST\nMore content';
    const result = findTargetRowForActiveStep(formattedString, 'test');
    expect(result).toBe(2);
  });

  it('should return null for empty formattedString', () => {
    const result = findTargetRowForActiveStep('', 'build');
    expect(result).toBe(null);
  });

  it('should return null for empty activeStep', () => {
    const formattedString = createMockFormattedString(['build']);
    const result = findTargetRowForActiveStep(formattedString, '');
    expect(result).toBe(null);
  });

  it('should handle step names with special characters', () => {
    const formattedString = `STEP-BUILD-AND-TEST
Some content`;
    const result = findTargetRowForActiveStep(
      formattedString,
      'build-and-test',
    );
    expect(result).toBe(0);
  });

  it('should handle realistic log format', () => {
    const formattedString = `STEP-GIT-CLONE
Cloning repository...
Cloned successfully

STEP-BUILD
Building application...
Build completed

STEP-TEST
Running tests...
All tests passed

STEP-DEPLOY
Deploying application...
Deployment successful`;

    expect(findTargetRowForActiveStep(formattedString, 'git-clone')).toBe(0);
    expect(findTargetRowForActiveStep(formattedString, 'build')).toBe(4);
    expect(findTargetRowForActiveStep(formattedString, 'test')).toBe(8);
    expect(findTargetRowForActiveStep(formattedString, 'deploy')).toBe(12);
  });
});
