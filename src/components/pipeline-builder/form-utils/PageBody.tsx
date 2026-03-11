import type { ReactNode, FC } from 'react';
import classnames from 'classnames';

interface PageBodyProps {
  children?: ReactNode;
  flexLayout?: boolean;
}

const PageBody: FC<PageBodyProps> = ({ children, flexLayout }) => (
  <div
    className={classnames('co-m-pane__body', { 'co-m-page__body': flexLayout })}
    style={{ paddingBottom: 0 }}
  >
    {children}
  </div>
);

export default PageBody;
