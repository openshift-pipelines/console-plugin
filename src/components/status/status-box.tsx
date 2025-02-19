import * as _ from 'lodash-es';
import * as React from 'react';
import classNames from 'classnames';
import { Button } from '@patternfly/react-core';
import { useTranslation, Trans } from 'react-i18next';
import './status-box.scss';

export const Box: React.FC<BoxProps> = ({ children, className }) => (
  <div className={classNames('cos-status-box', className)}>{children}</div>
);

export const LoadError: React.FC<LoadErrorProps> = ({
  label,
  className,
  message,
  canRetry = true,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Box className={className}>
      <div className="cp-text-align-center cos-error-title">
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

export const Loading: React.FC<LoadingProps> = ({ className }) => (
  <div
    className={classNames('co-m-loader co-an-fade-in-out', className)}
    data-test="loading-indicator"
  >
    <div className="co-m-loader-dot__one" />
    <div className="co-m-loader-dot__two" />
    <div className="co-m-loader-dot__three" />
  </div>
);
Loading.displayName = 'Loading';

export const LoadingInline: React.FC = () => (
  <Loading className="co-m-loader--inline" />
);
LoadingInline.displayName = 'LoadingInline';

export const LoadingBox: React.FC<LoadingBoxProps> = ({
  className,
  message,
}) => (
  <Box className={classNames('cos-status-box--loading', className)}>
    <Loading />
    {message && (
      <div className="cos-status-box__loading-message">{message}</div>
    )}
  </Box>
);
LoadingBox.displayName = 'LoadingBox';

type BoxProps = {
  children: React.ReactNode;
  className?: string;
};

type LoadErrorProps = {
  label: string;
  className?: string;
  message?: string;
  canRetry?: boolean;
};

type LoadingProps = {
  className?: string;
};

type LoadingBoxProps = {
  className?: string;
  message?: string;
};
