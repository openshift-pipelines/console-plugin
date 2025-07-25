import * as React from 'react';
import classNames from 'classnames';
import * as PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core';
import { withTranslation } from 'react-i18next';
import { PlayIcon, PauseIcon } from '@patternfly/react-icons';

import './toggle-play.scss';

class TogglePlayWithTranslation extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !!['className', 'active', 'onClick'].find(
      (prop) => nextProps[prop] !== this.props[prop],
    );
  }

  render() {
    const klass = classNames(
      'opp-toggle-play',
      this.props.className,
      this.props.active
        ? 'opp-toggle-play--active'
        : 'opp-toggle-play--inactive',
    );
    const { t } = this.props;
    return (
      <Button
        icon={this.props.active ? <PauseIcon /> : <PlayIcon />}
        variant="plain"
        className={klass}
        onClick={this.props.onClick}
        aria-label={
          this.props.active
            ? t('Pause event streaming')
            : t('Start streaming events')
        }
      />
    );
  }
}

export const TogglePlay = withTranslation()(TogglePlayWithTranslation);

TogglePlay.propTypes = {
  active: PropTypes.bool.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
