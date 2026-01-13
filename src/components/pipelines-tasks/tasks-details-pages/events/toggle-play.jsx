import * as React from 'react';
import * as PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { PauseIcon } from '@patternfly/react-icons/dist/esm/icons/pause-icon';
import { PlayIcon } from '@patternfly/react-icons/dist/esm/icons/play-icon';

import './toggle-play.scss';

const TogglePlayComponent = ({ className, active, onClick }) => {
  const { t } = useTranslation();

  return (
    <Button
      icon={active ? <PauseIcon /> : <PlayIcon />}
      variant="plain"
      className={css(
        'opp-toggle-play',
        active ? 'opp-toggle-play--active' : 'opp-toggle-play--inactive',
        className,
      )}
      onClick={onClick}
      aria-label={
        active ? t('Pause event streaming') : t('Start streaming events')
      }
    />
  );
};

export const TogglePlay = React.memo(
  TogglePlayComponent,
  (prevProps, nextProps) => {
    // Return true if props are equal (should NOT update)
    return !['className', 'active', 'onClick'].find(
      (prop) => prevProps[prop] !== nextProps[prop],
    );
  },
);

TogglePlay.propTypes = {
  active: PropTypes.bool.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};
