import {
  K8sResourceKind,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { useMemo } from 'react';
import { isBuilder, normalizeBuilderImages } from './imagestream-utils';
import { NormalizedBuilderImages } from './types';

export const useBuilderImages = (): [NormalizedBuilderImages, boolean, any] => {
  const resourceSelector = {
    isList: true,
    kind: 'ImageStream',
    namespace: 'openshift',
    prop: 'imageStreams',
  };
  const [imageStreams, loaded, loadedError] =
    useK8sWatchResource<K8sResourceKind[]>(resourceSelector);
  const builderImageStreams = useMemo(
    () => _.filter(imageStreams, isBuilder),
    [imageStreams],
  );

  const normalizedBuilderImages = useMemo(
    () => normalizeBuilderImages(builderImageStreams),
    [builderImageStreams],
  );

  return [normalizedBuilderImages, loaded, loadedError];
};
