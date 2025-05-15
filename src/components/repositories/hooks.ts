import { PAC_INFO, PIPELINE_NAMESPACE } from '../../consts';
import { ConfigMapModel } from '../../models';
import { useK8sGet } from '../hooks/use-k8sGet-hook';
import { ConfigMapKind } from './types';

export const usePacInfo = () =>
  useK8sGet<ConfigMapKind>(ConfigMapModel, PAC_INFO, PIPELINE_NAMESPACE);
