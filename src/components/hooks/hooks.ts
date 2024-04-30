import {
  WatchK8sResource,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { SDKStoreState } from '@openshift-console/dynamic-plugin-sdk/lib/app/redux-types';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { StartedByAnnotation, TektonResourceLabel } from '../../consts';
import { PersistentVolumeClaimModel, PipelineRunModel } from '../../models';
import { PersistentVolumeClaimKind, PipelineRunKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { getLatestRun } from '../utils/pipeline-augment';

export const useLatestPipelineRun = (
  pipelineName: string,
  namespace: string,
): PipelineRunKind => {
  const pipelineRunResource: WatchK8sResource = {
    kind: getReferenceForModel(PipelineRunModel),
    namespace,
    selector: {
      matchLabels: { [TektonResourceLabel.pipeline]: pipelineName },
    },
    optional: true,
    isList: true,
  };
  const [pipelineRun, pipelineRunLoaded, pipelineRunError] =
    useK8sWatchResource<PipelineRunKind[]>(pipelineRunResource);

  const latestRun = getLatestRun(pipelineRun, 'creationTimestamp');
  return pipelineRunLoaded && !pipelineRunError ? latestRun : null;
};

export const usePipelinePVC = (
  pipelineName: string,
  namespace: string,
): [PersistentVolumeClaimKind, boolean] => {
  const pvcResource: WatchK8sResource = {
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    selector: {
      matchLabels: { [TektonResourceLabel.pipeline]: pipelineName },
    },
    optional: true,
    isList: true,
  };
  const [PVC, PVCLoaded, PVCError] =
    useK8sWatchResource<PersistentVolumeClaimKind[]>(pvcResource);
  return [!PVCError && PVC.length > 0 ? PVC[0] : null, PVCLoaded];
};

export const useUserAnnotationForManualStart = () => {
  const user = useSelector((state: SDKStoreState) => state.sdkCore.user);
  if (!user?.username) {
    return {};
  }

  return {
    [StartedByAnnotation.user]: user.username,
  };
};
