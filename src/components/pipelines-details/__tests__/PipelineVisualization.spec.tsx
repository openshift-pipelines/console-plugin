import * as React from 'react';
import { configure, render, screen } from '@testing-library/react';
import { mockPipelinesJSON } from '../../utils/__tests__/pipeline-test-data';
import PipelineVisualization from '../PipelineVisualization';

configure({ testIdAttribute: 'data-test' });

describe('Pipeline Visualization', () => {
  it('Should render pipeline Visualization component if the pipeline has inline taskSpec ', () => {
    render(<PipelineVisualization pipeline={mockPipelinesJSON[2]} />);
    const PipelineTopologyGraphComponent = screen.getAllByTestId(
      'pipeline-visualization',
    );
    expect(PipelineTopologyGraphComponent).toHaveLength(1);
  });

  it('Should render a Alert message if the pipeline is null', () => {
    render(<PipelineVisualization pipeline={null} />);
    const alert = screen.getAllByText(
      'This Pipeline has no tasks to visualize.',
    );
    expect(alert).toHaveLength(1);
  });

  it('Should render a Alert message if the pipeline does not have tasks', () => {
    const mockPipeline = { ...mockPipelinesJSON[2], spec: { tasks: [] } };
    render(<PipelineVisualization pipeline={mockPipeline} />);
    const alert = screen.getAllByText(
      'This Pipeline has no tasks to visualize.',
    );
    expect(alert).toHaveLength(1);
  });

  it('Should render a pipeline Visualization component', () => {
    render(<PipelineVisualization pipeline={mockPipelinesJSON[1]} />);
    const PipelineTopologyGraphComponent = screen.getAllByTestId(
      'pipeline-visualization',
    );
    expect(PipelineTopologyGraphComponent).toHaveLength(1);
  });
});
