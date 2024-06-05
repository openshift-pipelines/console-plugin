import * as React from 'react';
// import { Tooltip } from '@patternfly/react-core';
// import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { configure, render, screen } from '@testing-library/react';
import { ComputedStatus } from '../../../types';
import WhenExpressionDecorator from '../WhenExpressionDecorator';

configure({ testIdAttribute: 'data-test' });

type WhenExpressionDecoratorProps = React.ComponentProps<
  typeof WhenExpressionDecorator
>;

describe('WhenExpressionDecorator', () => {
  // const whenExpressionContent = (content: string) => {
  //   return <div data-test="when-expression-tooltip">{content}</div>;
  // };
  const props: WhenExpressionDecoratorProps = {
    width: 10,
    height: 10,
    status: ComputedStatus.Failed,
    isPipelineRun: true,
    isFinallyTask: false,
  };

  it('should render diamond shape when expression decorator', () => {
    render(<WhenExpressionDecorator {...props} />);
    const diamondShape = screen.getAllByTestId('diamond-decorator');
    expect(diamondShape).not.toBeNull();
    expect(diamondShape).toHaveLength(1);
  });

  it('should not append a line after the diamond shape when appendLine prop is not passed', () => {
    render(<WhenExpressionDecorator {...props} />);
    const connectorLine = screen.queryAllByTestId('diamond-decorator-line');
    expect(connectorLine).toHaveLength(0);
  });

  it('should append a line after the diamond shape when appendLine prop is passed', () => {
    render(<WhenExpressionDecorator {...props} appendLine />);
    const diamondShape = screen.getAllByTestId('diamond-decorator');
    const connectorLine = screen.getAllByTestId('diamond-decorator-line');
    expect(diamondShape).not.toBeNull();
    expect(diamondShape).toHaveLength(1);
    expect(connectorLine).not.toBeNull();
    expect(connectorLine).toHaveLength(1);
  });

  it('should not render tooltip when enableTooltip prop is set to false', () => {
    render(<WhenExpressionDecorator {...props} enableTooltip={false} />);
    const diamondShape = screen.getAllByTestId('diamond-decorator');
    const tooltip = screen.queryAllByTestId('when-expression-tooltip');
    expect(diamondShape).not.toBeNull();
    expect(diamondShape).toHaveLength(1);
    expect(tooltip).toHaveLength(0);
  });

  // TODO fix the tooltip issue. Tooltip is not visible on hover over the whenExpression shape
  // it('should render tooltip when enableTooltip prop is set to true', () => {
  //   render(<WhenExpressionDecorator {...props} enableTooltip={true} />);
  //   const diamondShape = screen.getByTestId('diamond-decorator');
  //   fireEvent.mouseEnter(diamondShape);
  //   const tooltip = screen.getAllByTestId('when-expression-tooltip');
  //   expect(diamondShape).not.toBeNull();
  //   expect(tooltip).not.toBeNull();
  //   expect(tooltip).toHaveLength(1);
  // });

  // it('should contain the succeeded tooltip content if the task status is succeeded', () => {
  //   wrapper.setProps({ enableTooltip: true, status: ComputedStatus.Succeeded });
  //   const tooltip = wrapper.find(Tooltip);
  //   expect(tooltip.props().content).toEqual(
  //     whenExpressionContent('When expression was met'),
  //   );
  // });

  // it('should contain the skipped tooltip content if the task status is skipped', () => {
  //   wrapper.setProps({ enableTooltip: true, status: ComputedStatus.Skipped });
  //   const tooltip = wrapper.find(Tooltip);
  //   expect(tooltip.props().content).toEqual(
  //     whenExpressionContent('When expression was not met'),
  //   );
  // });

  // it('should contain the default tooltip content for other task status', () => {
  //   wrapper.setProps({
  //     enableTooltip: true,
  //     status: ComputedStatus.PipelineNotStarted,
  //   });

  //   expect(wrapper.find(Tooltip).props().content).toEqual(
  //     whenExpressionContent('When expression'),
  //   );
  //   wrapper.setProps({ enableTooltip: true, status: ComputedStatus.Failed });
  //   expect(wrapper.find(Tooltip).props().content).toEqual(
  //     whenExpressionContent('When expression was met'),
  //   );
  //   wrapper.setProps({ enableTooltip: true, status: ComputedStatus.Pending });
  //   expect(wrapper.find(Tooltip).props().content).toEqual(
  //     whenExpressionContent('When expression'),
  //   );
  //   wrapper.setProps({
  //     enableTooltip: true,
  //     status: ComputedStatus['In Progress'],
  //   });
  //   expect(wrapper.find(Tooltip).props().content).toEqual(
  //     whenExpressionContent('When expression'),
  //   );
  // });
});
