import * as React from 'react';
import {
  useParams,
  useLocation,
  useNavigate,
} from 'react-router-dom-v5-compat';

import { usePacData } from './hooks/usePacData';
import PacForm from './PacForm';
import PacOverview from './PacOverview';
import {
  useAccessReview,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { FLAG_OPENSHIFT_PIPELINE, PIPELINE_NAMESPACE } from '../../consts';
import { AccessDenied, ErrorPage404 } from '../common/error';
import { LoadingBox } from '../status/status-box';

const PacPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const isPipelinesEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);
  const [isAdmin, isAdminCheckLoading] = useAccessReview({
    namespace: PIPELINE_NAMESPACE,
    verb: 'create',
    resource: 'secrets',
  });
  const code = queryParams.get('code');
  const { ns: namespace } = useParams();

  React.useEffect(() => {
    if (isPipelinesEnabled && namespace !== PIPELINE_NAMESPACE) {
      navigate(`/pac/ns/${PIPELINE_NAMESPACE}`);
    }
  }, [isPipelinesEnabled, namespace, navigate]);

  const { loaded, secretData, loadError, isFirstSetup } = usePacData(code);

  if (!isPipelinesEnabled) {
    return <ErrorPage404 />;
  }

  if (!isAdminCheckLoading && !isAdmin) {
    return <AccessDenied />;
  }

  return (
    <>
      {!loaded ? (
        <LoadingBox />
      ) : loadError || secretData ? (
        <PacOverview
          namespace={namespace}
          secret={secretData}
          loadError={loadError}
          showSuccessAlert={isFirstSetup}
        />
      ) : (
        <PacForm namespace={namespace} />
      )}
    </>
  );
};

export default PacPage;
