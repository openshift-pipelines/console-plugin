import { render } from '@testing-library/react';
import PageBody from '../PageBody';

describe('Page Body', () => {
  it('it should add className for flex layout if flexLayout prop is sent', () => {
    const { container, rerender } = render(<PageBody />);
    expect((container.firstChild as HTMLElement).classList.contains('co-m-page__body')).toBe(false);
    rerender(<PageBody flexLayout />);
    expect((container.firstChild as HTMLElement).classList.contains('co-m-page__body')).toBe(true);
  });

  it('it should contain inputfield as a children of content wrapper', () => {
    const { container } = render(
      <PageBody>
        <input type="text" name="test-input" required />
      </PageBody>,
    );
    expect(container.querySelector('input[name="test-input"]')).not.toBeNull();
  });
});
