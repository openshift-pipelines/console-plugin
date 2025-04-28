type ErrorDetails = {
  title: string;
};

export type ErrorDetailsWithLogName = ErrorDetails & {
  containerName: string;
  podName: string;
  staticMessage?: string;
};
export type ErrorDetailsWithStaticLog = ErrorDetails & {
  staticMessage: string;
};

export type CombinedErrorDetails =
  | ErrorDetailsWithLogName
  | ErrorDetailsWithStaticLog;
