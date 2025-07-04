import {
  K8sResourceCommon,
  K8sResourceKind,
  K8sResourceKindReference,
  PrometheusAlert,
  WatchK8sResults,
} from '@openshift-console/dynamic-plugin-sdk';
import { NodeModel } from '@patternfly/react-topology';

export type TopologyResourcesObject = { [key: string]: K8sResourceKind[] };

export type TopologyDataResources = WatchK8sResults<TopologyResourcesObject>;

export interface OdcNodeModel extends NodeModel {
  resource?: K8sResourceCommon;
  resourceKind?: K8sResourceKindReference;
}

export type OverviewItem<T = K8sResourceCommon> = {
  obj: T;
  hpas?: K8sResourceCommon[];
  isOperatorBackedService?: boolean;
  isMonitorable?: boolean;
  monitoringAlerts?: PrometheusAlert[];
};

export interface TopologyDataObject<D = {}> {
  id: string;
  name: string;
  type: string;
  resources: OverviewItem;
  pods?: K8sResourceCommon[];
  data: D;
  resource: K8sResourceCommon | null;
  groupResources?: OdcNodeModel[];
}

export type GetTopologyResourceObject = (
  topologyObject: TopologyDataObject,
) => K8sResourceKind;
