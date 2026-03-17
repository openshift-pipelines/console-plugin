import type { ComponentProps } from 'react';
import { render, fireEvent } from '@testing-library/react';
import FormFooter from '../../../pipelines-details/multi-column-field/FormFooter';

jest.mock(
  '../../../pipelines-tasks/tasks-details-pages/events/useScrollContainer',
  () => ({
    useScrollContainer: () => [null, jest.fn()],
  }),
);

jest.mock('../../../hooks/useScrollShadows', () => ({
  useScrollShadows: () => 'none',
  Shadows: { both: 'both', bottom: 'bottom' },
}));

type FormFooterProps = ComponentProps<typeof FormFooter>;

describe('FormFooter', () => {
  let props: FormFooterProps;

  beforeEach(() => {
    props = {
      errorMessage: 'error',
      submitLabel: 'Create',
      resetLabel: 'Reset',
      cancelLabel: 'Cancel',
      handleReset: jest.fn(),
      handleCancel: jest.fn(),
      sticky: false,
      disableSubmit: false,
      isSubmitting: false,
    };
  });

  it('should contain submit, reset and cancel button', () => {
    const { container } = render(<FormFooter {...props} />);
    expect(
      container.querySelector('[data-test-id="submit-button"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-test-id="reset-button"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-test-id="cancel-button"]'),
    ).not.toBeNull();
  });

  it('should contain right labels in the submit and reset button', () => {
    const { container } = render(<FormFooter {...props} />);
    expect(
      container.querySelector('[data-test-id="submit-button"]').textContent,
    ).toBe('Create');
    expect(
      container.querySelector('[data-test-id="reset-button"]').textContent,
    ).toBe('Reset');
    expect(
      container.querySelector('[data-test-id="cancel-button"]').textContent,
    ).toBe('Cancel');
  });

  it('should be able to configure data-test-id and labels', () => {
    const { container, rerender } = render(<FormFooter {...props} />);
    rerender(
      <FormFooter
        {...props}
        submitLabel="submit-lbl"
        resetLabel="reset-lbl"
        cancelLabel="cancel-lbl"
      />,
    );
    expect(
      container.querySelector('[data-test-id="submit-button"]').textContent,
    ).toBe('submit-lbl');
    expect(
      container.querySelector('[data-test-id="reset-button"]').textContent,
    ).toBe('reset-lbl');
    expect(
      container.querySelector('[data-test-id="cancel-button"]').textContent,
    ).toBe('cancel-lbl');
  });

  it('should be able to make the action buttons sticky', () => {
    const { container, rerender } = render(<FormFooter {...props} />);
    rerender(<FormFooter {...props} sticky />);
    expect(
      (container.firstChild as HTMLElement).classList.contains(
        'ocs-form-footer__sticky',
      ),
    ).toBe(true);
  });

  it('should have submit button when handle submit is not passed', () => {
    const { container } = render(<FormFooter {...props} />);
    expect(
      container
        .querySelector('[data-test-id="submit-button"]')
        .getAttribute('type'),
    ).toBe('submit');
  });

  it('should not have submit button when handle submit callback is passed', () => {
    const { container } = render(
      <FormFooter {...props} handleSubmit={jest.fn()} />,
    );
    expect(
      container
        .querySelector('[data-test-id="submit-button"]')
        .getAttribute('type'),
    ).not.toBe('submit');
  });

  it('should call the handler when a button is clicked', () => {
    const handleSubmit = jest.fn();
    const { container } = render(
      <FormFooter {...props} handleSubmit={handleSubmit} />,
    );
    fireEvent.click(container.querySelector('[data-test-id="submit-button"]'));
    expect(handleSubmit).toHaveBeenCalled();

    fireEvent.click(container.querySelector('[data-test-id="reset-button"]'));
    expect(props.handleReset).toHaveBeenCalled();

    fireEvent.click(container.querySelector('[data-test-id="cancel-button"]'));
    expect(props.handleCancel).toHaveBeenCalled();
  });
});
