import { useState, useEffect } from 'react';
import { useFormikContext } from 'formik';

import ConfigTypeSection from './ConfigTypeSection';
import WebhookSection from './WebhookSection';
import { usePacInfo } from './hooks';
import { PacConfigurationTypes, RepositoryFormValues } from './types';
import { GitProvider } from '../utils/repository-utils';

const AdvancedConfigurations = () => {
  const [githubAppAvailable, setGithubAppAvailable] = useState(false);
  const { values, setFieldValue } = useFormikContext<RepositoryFormValues>();
  const [pac, loaded] = usePacInfo();

  useEffect(() => {
    if (loaded && !!pac && pac.data['app-link']) {
      setGithubAppAvailable(true);
      setFieldValue('githubAppAvailable', true);
      setFieldValue('method', PacConfigurationTypes.GITHUB);
    } else {
      setFieldValue('method', PacConfigurationTypes.WEBHOOK);
    }
  }, [pac, loaded, setFieldValue]);

  return (
    values.gitProvider && (
      <>
        {githubAppAvailable && values.gitProvider === GitProvider.GITHUB ? (
          <ConfigTypeSection pac={pac} />
        ) : (
          <WebhookSection pac={pac} />
        )}
      </>
    )
  );
};

export default AdvancedConfigurations;
