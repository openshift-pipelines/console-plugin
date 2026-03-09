import { render } from '@testing-library/react';
import FlexForm from '../FlexForm';

describe('FlexForm', () => {
  it('it should add styles for flex layout', () => {
    const { container } = render(<FlexForm onSubmit={() => {}} />);
    const form = container.querySelector('form');
    expect(form.style.display).toBe('flex');
    expect(form.style.flexGrow).toBe('1');
    expect(form.style.flexDirection).toBe('column');
  });

  it('it should return original form props', () => {
    const onSubmit = jest.fn();
    const { container } = render(<FlexForm onSubmit={onSubmit} />);
    expect(container.querySelector('form')).not.toBeNull();
  });

  it('it should return form component as a wrapper', () => {
    const { container } = render(<FlexForm onSubmit={() => {}} />);
    expect(container.querySelector('form')).not.toBeNull();
  });

  it('it should contain inputfield as a children of content wrapper', () => {
    const { container } = render(
      <FlexForm onSubmit={() => {}}>
        <input type="text" name="test-input" required />
      </FlexForm>,
    );
    expect(container.querySelector('input[name="test-input"]')).not.toBeNull();
  });
});
