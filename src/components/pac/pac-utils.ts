import {
  k8sCreate,
  k8sGet,
  k8sListItems,
  k8sPatch,
} from '@openshift-console/dynamic-plugin-sdk';
import { PIPELINE_NAMESPACE } from '../../consts';
import { ConfigMapModel, RouteModel, SecretModel } from '../../models';
import { RouteKind, SecretType } from '../../types';
import { EVENT_LISTNER_NAME, PAC_INFO, PAC_SECRET_NAME } from './const';

export const createPACSecret = (
  appId: string,
  privateKey: string,
  webHookSecret: string,
  appName: string,
  appUrl: string,
  namespace: string = PIPELINE_NAMESPACE,
) => {
  const { apiVersion, kind } = SecretModel;
  const secretPayload = {
    apiVersion,
    stringData: {
      'github-application-id': appId,
      'webhook.secret': webHookSecret,
      'github-private-key': privateKey,
    },
    kind,
    metadata: {
      name: PAC_SECRET_NAME,
      namespace,
      annotations: { appName, appUrl },
    },
    type: SecretType.opaque,
  };

  return k8sCreate({ model: SecretModel, data: secretPayload });
};

export const getControllerUrl = async () => {
  try {
    const [pacControllerUrl] = await k8sListItems<RouteKind>({
      model: RouteModel,
      queryParams: {
        ns: PIPELINE_NAMESPACE,
        labelSelector: {
          matchLabels: {
            'pipelines-as-code/route': 'controller',
          },
        },
      },
    });
    const [elRouteData] = await k8sListItems<RouteKind>({
      model: RouteModel,
      queryParams: {
        ns: PIPELINE_NAMESPACE,
        labelSelector: {
          matchLabels: {
            eventlistener: EVENT_LISTNER_NAME,
          },
        },
      },
    });
    const controller: RouteKind = pacControllerUrl || elRouteData;
    return (controller?.spec?.host && `https://${controller.spec.host}`) ?? '';
  } catch (e) {
    console.warn('Error while fetching Controlleru url:', e); // eslint-disable-line no-console
    return '';
  }
};

export const getPACInfo = async () =>
  k8sGet({
    model: ConfigMapModel,
    name: PAC_INFO,
    ns: PIPELINE_NAMESPACE,
  });

export const updatePACInfo = async (appLink: string = '') => {
  try {
    const controllerUrl = await getControllerUrl();
    const cfg = await getPACInfo();

    await k8sPatch({
      model: ConfigMapModel,
      resource: cfg,
      data: [
        {
          op: 'replace',
          path: `/data/controller-url`,
          value: controllerUrl || '',
        },
        { op: 'replace', path: `/data/provider`, value: 'github' },
        { op: 'replace', path: `/data/app-link`, value: appLink },
      ],
    });
  } catch (e) {
    console.warn('Error while updating PAC info:', e); // eslint-disable-line no-console
  }
};
