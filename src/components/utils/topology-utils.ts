import { GetTopologyResourceObject } from '../../types/topology-types';

export const getTopologyResourceObject: GetTopologyResourceObject = (
  topologyObject,
) => {
  if (!topologyObject) {
    return null;
  }
  return topologyObject.resource || topologyObject.resources?.obj;
};
