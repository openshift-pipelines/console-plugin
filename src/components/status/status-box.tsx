import * as _ from 'lodash-es';
import type { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import { Loading } from '../Loading';
import './status-box.scss';

export const Box: FC<BoxProps> = ({ children, className }) => (
  <div className={classNames('cos-status-box', className)}>{children}</div>
);

export const LoadError: FC<LoadErrorProps> = ({
  label,
  className,
  message,
  canRetry = true,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Box className={className}>
      <div className="cp-text-align-center pf-v6-u-text-color-status-danger">
        {_.isString(message)
          ? t('Error Loading {{label}}: {{message}}', {
              label,
              message,
            })
          : t('Error Loading {{label}}', { label })}
      </div>
      {canRetry && (
        <div className="cp-text-align-center">
          <Trans ns="plugin__pipelines-console-plugin">
            Please{' '}
            <Button
              type="button"
              onClick={window.location.reload.bind(window.location)}
              variant="link"
              isInline
            >
              try again
            </Button>
            .
          </Trans>
        </div>
      )}
    </Box>
  );
};
LoadError.displayName = 'LoadError';

export const LoadingBox: FC<LoadingBoxProps> = ({ className, message }) => (
  <Box className={classNames('pf-v6-u-h-100 pf-v6-u-w-100', className)}>
    <Loading />
    {message && <div className="pf-v6-u-mt-md">{message}</div>}
  </Box>
);
LoadingBox.displayName = 'LoadingBox';

type BoxProps = {
  children: ReactNode;
  className?: string;
};

type LoadErrorProps = {
  label: string;
  className?: string;
  message?: string;
  canRetry?: boolean;
};

type LoadingBoxProps = {
  className?: string;
  message?: string;
};
