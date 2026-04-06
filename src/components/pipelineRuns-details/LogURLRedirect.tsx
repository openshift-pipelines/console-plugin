import type { FC } from 'react';
import { Navigate, useLocation, useParams } from 'react-router';

const createLogURL = (pathname: string, taskName: string): string => {
  const basePath = pathname.replace(/\/$/, '');
  const detailsURL = basePath.split('/logs/');
  return `${detailsURL[0]}/logs?taskName=${taskName}`;
};

export const LogURLRedirect: FC = () => {
  const location = useLocation();
  const { taskName } = useParams();
  return <Navigate to={createLogURL(location.pathname, taskName)} replace />;
};
