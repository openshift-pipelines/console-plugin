import { components } from './api';

export type Result = components['schemas']['Result'];

export type Record = components['schemas']['Record'];

export type RecordSummary = components['schemas']['RecordSummary'];

export type Log = components['schemas']['Log'];

export type LogSummary = components['schemas']['LogSummary'];

export type Status = components['schemas']['Status'];

export type RecordType = components['schemas']['RecordType'];

export * from './approvals';
export * from './common';
export * from './coreTekton';
export * from './openshift';
export * from './pipeline';
export * from './pipelineResource';
export * from './pipelineRun';
export * from './repository';
export * from './task';
export * from './taskRun';
export * from './triggers';
