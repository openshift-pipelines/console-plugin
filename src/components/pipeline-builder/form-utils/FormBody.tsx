import type { ReactNode, CSSProperties, HTMLProps, FC } from 'react';
import classNames from 'classnames';

type FormBodyProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  flexLayout?: boolean;
  disablePaneBody?: boolean;
};

const FormBody: FC<FormBodyProps & HTMLProps<HTMLDivElement>> = ({
  children,
  className,
  style,
  disablePaneBody = false,
  flexLayout = false,
  ...props
}) => (
  <div
    {...props}
    className={classNames(
      'pf-v6-c-form',
      { 'co-m-pane__body': !disablePaneBody },
      className,
    )}
    style={
      flexLayout
        ? {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            paddingBottom: 0,
            ...(style ?? {}),
          }
        : { paddingBottom: 0, ...(style ?? {}) }
    }
  >
    {children}
  </div>
);

export default FormBody;
