import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Spinner,
} from '@patternfly/react-core';
import { ClusterQueueKind, PipelineRunKind } from '../../types';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkloads } from '../hooks/useMultiKueueResources';
import {
  getGroupVersionKindForModel,
  useActiveNamespace,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { ClusterQueueModel } from '../../models';
import { calculateDuration } from '../utils/pipeline-utils';

type MultiClusterExecutionDetailsProps = {
  pipelineRun: PipelineRunKind;
};
const MultiClusterExecutionDetails: FC<MultiClusterExecutionDetailsProps> = ({
  pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [activeNamespace] = useActiveNamespace();

  const [workloads, workloadsLoaded, workloadsError] = useWorkloads(
    activeNamespace,
    pipelineRun,
  );

  const workload = workloads?.[0];

  const [clusterQueue, clusterQueueLoaded, clusterQueueLoadError] =
    useK8sWatchResource<ClusterQueueKind>({
      groupVersionKind: getGroupVersionKindForModel(ClusterQueueModel),
      name: workload?.status?.admission?.clusterQueue,
    });

  const createdTime = workload?.metadata?.creationTimestamp;
  const admittedTime = workload?.status?.conditions?.find(
    (condition) => condition.type === 'Admitted' && condition.status === 'True',
  )?.lastTransitionTime;
  const queueWaitTime =
    createdTime && admittedTime
      ? calculateDuration(createdTime, admittedTime, true)
      : '-';

  return (
    <Card>
      <CardTitle>{t('Cluster Execution')}</CardTitle>
      <CardBody>
        <Grid hasGutter>
          <GridItem sm={6}>
            <Grid hasGutter>
              <DescriptionList isHorizontal aria-label="Horizontal">
                <DescriptionListTerm>
                  {t('Queue Information')}
                </DescriptionListTerm>
                {workloadsError || clusterQueueLoadError ? (
                  <Alert
                    variant="danger"
                    isInline
                    title={t('Unable to load Queue information')}
                    className="pf-v6-u-mb-md pf-v6-u-mt-lg"
                  />
                ) : (
                  <>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        {t('Cluster Queue')}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {workloadsLoaded && workload ? (
                          workload?.status?.admission?.clusterQueue
                        ) : (
                          <Spinner size="md" isInline />
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        {t('Local Queue')}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {workloadsLoaded && workload ? (
                          workload?.spec?.queueName
                        ) : (
                          <Spinner size="md" isInline />
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        {t('Queue Wait')}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {workloadsLoaded && workload ? (
                          queueWaitTime
                        ) : (
                          <Spinner size="md" isInline />
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Pending')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {clusterQueueLoaded ? (
                          clusterQueue?.status?.pendingWorkloads
                        ) : (
                          <Spinner size="md" isInline />
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Active')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        {clusterQueueLoaded ? (
                          clusterQueue?.status?.admittedWorkloads
                        ) : (
                          <Spinner size="md" isInline />
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </>
                )}
              </DescriptionList>
            </Grid>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};

export default MultiClusterExecutionDetails;
