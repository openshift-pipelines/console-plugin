import { useRef, useState, useEffect } from 'react';

import { consoleFetch } from '@openshift-console/dynamic-plugin-sdk';
import { PIPELINE_NAMESPACE } from '../../../consts';
import { SecretModel } from '../../../models';
import { SecretKind } from '../../../types';
import { useK8sGet } from '../../hooks/use-k8sGet-hook';
import { removeQueryArgument } from '../../utils/router';
import { PAC_GH_APP_MANIFEST_API, PAC_SECRET_NAME } from '../const';
import { createPACSecret, updatePACInfo } from '../pac-utils';

export const usePacData = (
  code: string,
): {
  loaded: boolean;
  secretData: SecretKind;
  loadError: Error;
  isFirstSetup: boolean;
} => {
  const apiCallProgressRef = useRef(false);
  const [loaded, setloaded] = useState<boolean>(false);
  const [secretData, setSecretData] = useState<SecretKind>();
  const [loadError, setLoadError] = useState(null);
  const [isFirstSetup, setIsFirstSetup] = useState<boolean>(false);
  const [pacSecretData, pacSecretDataLoaded, pacSecretDataError] =
    useK8sGet<SecretKind>(SecretModel, PAC_SECRET_NAME, PIPELINE_NAMESPACE);

  useEffect(() => {
    let mounted = true;
    const configureGitHubApp = async () => {
      if (code && !apiCallProgressRef.current) {
        apiCallProgressRef.current = true;
        try {
          const response = await consoleFetch(
            `${PAC_GH_APP_MANIFEST_API}/${code}/conversions`,
            {
              method: 'POST',
            },
          );
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { name, id, pem, webhook_secret, html_url } = data;
          const secret = await createPACSecret(
            id.toString(),
            pem,
            webhook_secret,
            name,
            html_url,
          );
          await updatePACInfo(html_url);
          if (mounted) {
            setSecretData(secret);
            setloaded(true);
            removeQueryArgument('code');
            setIsFirstSetup(true);
            apiCallProgressRef.current = false;
          }
        } catch (err) {
          if (mounted) {
            apiCallProgressRef.current = false;
            removeQueryArgument('code');
            setloaded(true);
            setLoadError(err);
          }
        }
      }
    };
    configureGitHubApp();
    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    if (pacSecretDataLoaded && pacSecretData && !pacSecretDataError) {
      setSecretData(pacSecretData);
      setloaded(true);
    } else if (
      pacSecretDataLoaded &&
      (pacSecretDataError as any)?.code === 404 &&
      !apiCallProgressRef.current
    ) {
      setloaded(true);
    }
  }, [pacSecretData, pacSecretDataError, pacSecretDataLoaded]);

  return { loaded, secretData, loadError, isFirstSetup };
};
