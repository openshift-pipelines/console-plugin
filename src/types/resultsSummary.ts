import { Selector } from '@openshift-console/dynamic-plugin-sdk';
import { SummaryProps } from 'src/components/pipelines-overview/utils';
import { DevConsoleEndpointRequest } from './backendAPI';

export enum DataType {
  PipelineRun = 'tekton.dev/v1.PipelineRun',
  TaskRun = 'tekton.dev/v1.TaskRun',
}

export type ResultRecord = {
  name: string;
  uid: string;
  createTime: string;
  updateTime: string;
  etag: string;
  data: {
    // tekton.dev/v1.PipelineRun | tekton.dev/v1.TaskRun | results.tekton.dev/v1alpha2.Log
    type: string;
    value: string;
  };
};

export type TRRequest = {
  searchNamespace: string;
  searchParams: string;
} & DevConsoleEndpointRequest;

export type TaskRunLogRequest = {
  taskRunPath: string;
} & DevConsoleEndpointRequest;

export type Log = {
  result: {
    name: string;
    data: string;
  };
};

export type RecordsList = {
  nextPageToken?: string;
  records: ResultRecord[];
};

export type TektonResultsOptions = {
  pageSize?: number;
  selector?: Selector;
  // limit cannot be used in conjuction with pageSize and takes precedence
  limit?: number;
  filter?: string;
  summary?: string;
  data_type?: DataType;
  groupBy?: string;
};

export type SummaryRequest = {
  searchNamespace: string;
  searchParams: string;
} & DevConsoleEndpointRequest;

export type SummaryResponse = {
  summary: SummaryProps[];
};
