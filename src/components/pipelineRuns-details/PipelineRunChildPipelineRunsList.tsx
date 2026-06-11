import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  K8sResourceKind,
  ListPageBody,
} from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { EmptyState, EmptyStateBody } from '@patternfly/react-core';
import { PipelineRunKind } from '../../types';
import usePipelineRunsColumns from '../pipelineRuns-list/usePipelineRunsColumns';
import { getPipelineRunsListDataViewRows } from '../pipelineRuns-list/PipelineRunsRow';
import { useGetActiveUser } from '../hooks/hooks';
import {
  useChildPipelineRunReferences,
  useChildPipelineRuns,
} from '../hooks/useChildPipelineRuns';

import '../multi-tab-list/MultiTabListPage.scss';

type PipelineRunChildPipelineRunsListProps = {
  ns?: string;
  obj?: K8sResourceKind;
};

const PipelineRunChildPipelineRunsList: FC<
  PipelineRunChildPipelineRunsListProps
> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const pipelineRun = obj as PipelineRunKind;
  const namespace = pipelineRun?.metadata?.namespace;
  const childPipelineRunRefs = useChildPipelineRunReferences(pipelineRun);
  const [childPipelineRuns, allLoaded] = useChildPipelineRuns(
    namespace,
    childPipelineRunRefs,
    { depth: 1 },
  );
  const currentUser = useGetActiveUser();
  const columns = usePipelineRunsColumns(namespace);

  if (!childPipelineRunRefs?.length) {
    return (
      <EmptyState>
        <EmptyStateBody>{t('No child pipeline runs found')}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <ListPageBody>
      <ConsoleDataView<PipelineRunKind>
        label={t('PipelineRuns')}
        columns={columns}
        data={childPipelineRuns}
        loaded={allLoaded}
        getDataViewRows={getPipelineRunsListDataViewRows}
        customRowData={{ currentUser }}
        hideColumnManagement
        hideNameLabelFilters
      />
    </ListPageBody>
  );
};

export default PipelineRunChildPipelineRunsList;
