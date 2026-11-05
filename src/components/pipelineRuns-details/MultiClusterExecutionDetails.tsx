import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  FlexItem,
  Label,
  ProgressStep,
  ProgressStepper,
  ProgressStepProps,
  Spinner,
  Flex,
  Divider,
} from '@patternfly/react-core';
import { Condition, PipelineRunKind } from '../../types';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isClusterConnected,
  useGetClusterQueue,
  useGetMultiKueueCluster,
  useWorkloads,
} from '../hooks/useMultiKueueResources';
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';
import { calculateDuration } from '../utils/pipeline-utils';
import { RhUiInProgressIcon } from '@patternfly/react-icons';

type MultiClusterExecutionDetailsProps = {
  pipelineRun: PipelineRunKind;
};

const ConditionReasonLabel: FC<{ condition?: Condition }> = ({ condition }) => {
  if (!condition?.reason && condition?.status != 'Unknown') {
    return null;
  }

  const isSuccess = condition?.status === 'True';

  return (
    <Label
      isCompact
      className="pf-v6-u-ml-sm"
      color={isSuccess ? undefined : 'grey'}
      status={isSuccess ? 'success' : undefined}
    >
      {condition?.reason
        ? condition?.reason
        : condition?.status == 'Unknown' && condition?.status}
    </Label>
  );
};

const GetProgressStepVariant = (
  status: string,
): ProgressStepProps['variant'] => {
  switch (status) {
    case 'True':
      return 'success';
    case 'False':
      return 'danger';
    default:
      return 'pending';
  }
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
    useGetClusterQueue(workload?.status?.admission?.clusterQueue);

  const [targetCluster, targetClusterLoaded, targetClusterLoadError] =
    useGetMultiKueueCluster(workload?.status?.clusterName);

  const createdTime = workload?.metadata?.creationTimestamp;
  const admittedTime = workload?.status?.conditions?.find(
    (condition) => condition.type === 'Admitted' && condition.status === 'True',
  )?.lastTransitionTime;
  const queueWaitTime =
    createdTime && admittedTime
      ? calculateDuration(createdTime, admittedTime, true)
      : '-';

  const workloadQuotaReservation = workload?.status?.conditions?.find(
    (c) => c.type === 'QuotaReserved',
  );

  const workloadAdmission = workload?.status?.conditions?.find(
    (c) => c.type === 'Admitted',
  );

  const admissionCheck = workload?.status?.admissionChecks?.find(
    (c) => c.state === 'Ready',
  );

  const workloadCompletion = workload?.status?.conditions?.find(
    (c) => c.type === 'Finished',
  );

  return (
    <Card>
      <CardTitle>{t('Cluster Execution')}</CardTitle>
      <CardBody>
        <Flex
          direction={{ default: 'column', sm: 'row' }}
          alignItems={{ sm: 'alignItemsStretch' }}
          spaceItems={{ default: 'spaceItemsLg' }}
        >
          <FlexItem flex={{ sm: 'flex_1' }}>
            <DescriptionList isHorizontal aria-label="Horizontal">
              <DescriptionListTerm>
                {t('Dispatch Timeline')}
              </DescriptionListTerm>
              {workloadsError ? (
                <Alert
                  variant="danger"
                  isInline
                  title={t('Unable to load dispatch timeline')}
                  className="pf-v6-u-mb-md pf-v6-u-mt-lg"
                />
              ) : (
                <ProgressStepper isVertical>
                  <ProgressStep
                    variant={GetProgressStepVariant(
                      workloadQuotaReservation?.status,
                    )}
                    icon={
                      !workloadsLoaded || !workloadQuotaReservation ? (
                        <RhUiInProgressIcon />
                      ) : undefined
                    }
                    id="quota-reservation"
                  >
                    <Flex>
                      <DescriptionListTerm>
                        {t('1. Quota reservation')}
                      </DescriptionListTerm>
                      <ConditionReasonLabel
                        condition={workloadQuotaReservation}
                      />
                    </Flex>
                  </ProgressStep>
                  <ProgressStep
                    variant={GetProgressStepVariant(workloadAdmission?.status)}
                    icon={
                      !workloadsLoaded || !workloadAdmission ? (
                        <RhUiInProgressIcon />
                      ) : undefined
                    }
                    id="workload-admission"
                  >
                    <Flex>
                      <DescriptionListTerm>
                        {t('2. Workload admission')}
                      </DescriptionListTerm>
                      <ConditionReasonLabel condition={workloadAdmission} />
                    </Flex>
                  </ProgressStep>
                  <ProgressStep
                    variant={GetProgressStepVariant(workloadAdmission?.status)}
                    icon={
                      !workloadsLoaded || !admissionCheck ? (
                        <RhUiInProgressIcon />
                      ) : undefined
                    }
                    id="admission-checks"
                  >
                    <Flex>
                      <DescriptionListTerm>
                        {t('3. Admission Checks')}
                      </DescriptionListTerm>
                      <ConditionReasonLabel
                        condition={{
                          type: 'AdmissionCheck',
                          status:
                            admissionCheck?.state === 'Ready' ? 'True' : null,
                          reason: admissionCheck?.state,
                        }}
                      />
                    </Flex>
                  </ProgressStep>
                  <ProgressStep
                    variant={GetProgressStepVariant(workloadCompletion?.status)}
                    icon={
                      !workloadsLoaded || !workloadCompletion ? (
                        <RhUiInProgressIcon />
                      ) : undefined
                    }
                    id="workload-completion"
                  >
                    <Flex>
                      <DescriptionListTerm>
                        {t('4. Workload completion')}
                      </DescriptionListTerm>
                      <ConditionReasonLabel condition={workloadCompletion} />
                    </Flex>
                  </ProgressStep>
                </ProgressStepper>
              )}
            </DescriptionList>
          </FlexItem>
          <Divider orientation={{ default: 'vertical' }} />
          <FlexItem flex={{ sm: 'flex_1' }}>
            <DescriptionList isHorizontal aria-label="Horizontal">
              <DescriptionListTerm>
                {t('Target Cluster Information')}
              </DescriptionListTerm>
              {workloadsError || targetClusterLoadError ? (
                <Alert
                  variant="danger"
                  isInline
                  title={t('Unable to load target cluster information')}
                  className="pf-v6-u-mb-md pf-v6-u-mt-lg"
                />
              ) : (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Cluster')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {workloadsLoaded && workload ? (
                        workload?.status?.clusterName
                      ) : (
                        <Spinner size="md" isInline />
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {targetClusterLoaded && targetCluster ? (
                        isClusterConnected(targetCluster) ? (
                          t('Connected')
                        ) : (
                          t('Disconnected')
                        )
                      ) : (
                        <Spinner size="md" isInline />
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              )}
            </DescriptionList>
          </FlexItem>
          <Divider orientation={{ default: 'vertical' }} />
          <FlexItem flex={{ sm: 'flex_1' }}>
            <DescriptionList isHorizontal aria-label="Horizontal">
              <DescriptionListTerm>
                {t('Queue Information')}
              </DescriptionListTerm>
              {workloadsError || clusterQueueLoadError ? (
                <Alert
                  variant="danger"
                  isInline
                  title={t('Unable to load queue information')}
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
                    <DescriptionListTerm>{t('Queue Wait')}</DescriptionListTerm>
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
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default MultiClusterExecutionDetails;
