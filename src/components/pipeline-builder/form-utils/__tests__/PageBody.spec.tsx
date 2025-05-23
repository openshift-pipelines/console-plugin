import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import PageBody from '../PageBody';
import InputField from '../../../pipelines-details/multi-column-field/InputField';

describe('Page Body', () => {
  let wrapper: ShallowWrapper<any>;
  beforeEach(() => {
    wrapper = shallow(
      <PageBody>
        <InputField type={TextInputTypes.text} name="test-input" required />
      </PageBody>,
    );
  });

  it('it should add className for flex layout if flexLayout prop is sent', () => {
    expect(wrapper.hasClass('co-m-page__body')).toBe(false);
    wrapper.setProps({ flexLayout: true });
    expect(wrapper.hasClass('co-m-page__body')).toBe(true);
  });

  it('it should contain inputfield as a children of content wrapper', () => {
    const content = wrapper.children().at(0);
    expect(content.is(InputField)).toEqual(true);
  });
});
