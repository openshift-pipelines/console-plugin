import * as React from 'react';
import { PipelineKind, PipelineRunKind, PipelineWithLatest } from '../../types';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import {
  KEBAB_ACTION_DELETE_ID,
  KEBAB_ACTION_EDIT_ANNOTATIONS_ID,
  KEBAB_ACTION_EDIT_ID,
  KEBAB_ACTION_EDIT_LABELS_ID,
  KEBAB_BUTTON_ID,
  StartedByAnnotation,
} from '../../consts';
import { useTranslation } from 'react-i18next';
import {
  k8sCreate,
  useAccessReview,
  useAnnotationsModal,
  useDeleteModal,
  useLabelsModal,
  useModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel, PipelineRunModel } from '../../models';
import _ from 'lodash';
import {
  AddTriggerModal,
  RemoveTriggerModal,
  startPipelineModal,
} from '../start-pipeline';
import { useNavigate } from 'react-router-dom-v5-compat';
import { errorModal } from '../modals/error-modal';
import { getPipelineRunData } from '../start-pipeline/utils';
import { useHistory } from 'react-router-dom';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { rerunPipeline } from '../utils/pipelines-actions';
import { usePipelineTriggerTemplateNames } from '../utils/triggers';
import { resourcePathFromModel } from '../utils/utils';

type PipelineKebabProps = {
  pipeline: PipelineWithLatest;
};

export const triggerPipeline = (
  pipeline: PipelineKind,
  onSubmit?: (pipelineRun: PipelineRunKind) => void,
) => {
  k8sCreate({ model: PipelineRunModel, data: getPipelineRunData(pipeline) })
    .then(onSubmit)
    .catch((err) => errorModal({ error: err.message }));
};

const PipelineKebab: React.FC<PipelineKebabProps> = ({ pipeline }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { name, namespace } = pipeline.metadata;
  const launchDeleteModal = useDeleteModal(pipeline);
  const launchAnnotationsModal = useAnnotationsModal(pipeline);
  const launchLabelsModal = useLabelsModal(pipeline);
  const launchModal = useModal();
  const navigate = useNavigate();
  const history = useHistory();
  const [isOpen, setIsOpen] = React.useState(false);
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];
  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const [canCreateResource] = useAccessReview({
    group: PipelineRunModel.apiGroup,
    resource: PipelineRunModel.plural,
    verb: 'create',
    name,
    namespace,
  });

  const [canEditResource] = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    verb: 'update',
    name,
    namespace,
  });

  const [canDeleteResource] = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    verb: 'delete',
    name,
    namespace,
  });

  const handlePipelineRunSubmit = (pipelineRun: PipelineRunKind) => {
    navigate(
      resourcePathFromModel(
        PipelineRunModel,
        pipelineRun.metadata.name,
        pipelineRun.metadata.namespace,
      ),
    );
  };

  const startPipeline = () => {
    const params = _.get(pipeline, ['spec', 'params'], []);
    const resources = _.get(pipeline, ['spec', 'resources'], []);
    const workspaces = _.get(pipeline, ['spec', 'workspaces'], []);

    if (!_.isEmpty(params) || !_.isEmpty(resources) || !_.isEmpty(workspaces)) {
      launchModal(startPipelineModal, {
        pipeline,
        onSubmit: handlePipelineRunSubmit,
      });
    } else {
      triggerPipeline(pipeline, handlePipelineRunSubmit);
    }
  };

  const rerunPipelineAndRedirect = () => {
    rerunPipeline(PipelineRunModel, pipeline.latestRun, launchModal, {
      onComplete: handlePipelineRunSubmit,
    });
  };

  const addTrigger = () => {
    const cleanPipeline: PipelineKind = {
      ...pipeline,
      metadata: {
        ...pipeline.metadata,
        annotations: _.omit(pipeline.metadata.annotations, [
          StartedByAnnotation.user,
        ]),
      },
    };
    launchModal(AddTriggerModal, { pipeline: cleanPipeline });
  };

  const removeTrigger = () => {
    launchModal(RemoveTriggerModal, { pipeline });
  };

  const editURL = `/k8s/ns/${namespace}/${getReferenceForModel(
    PipelineModel,
  )}/${encodeURIComponent(name)}/builder`;

  const dropdownItems = [
    <DropdownItem
      key="start-pipeline"
      component="button"
      isDisabled={!canCreateResource}
      data-test-action="start-pipeline"
      onClick={startPipeline}
    >
      {t('Start')}
    </DropdownItem>,
    ...(pipeline.latestRun
      ? [
          <DropdownItem
            key="start-last-run"
            component="button"
            isDisabled={!canCreateResource}
            data-test-action="start-last-run"
            onClick={rerunPipelineAndRedirect}
          >
            {t('Start last run')}
          </DropdownItem>,
        ]
      : []),
    <DropdownItem
      key="add-trigger"
      component="button"
      isDisabled={!canCreateResource}
      data-test-action="add-trigger"
      onClick={addTrigger}
    >
      {t('Add Trigger')}
    </DropdownItem>,
    ...(templateNames.length > 0
      ? [
          <DropdownItem
            key="remove-trigger"
            component="button"
            isDisabled={!canDeleteResource}
            data-test-action="remove-trigger"
            onClick={removeTrigger}
          >
            {t('Remove Trigger')}
          </DropdownItem>,
        ]
      : []),
    <DropdownItem
      key={KEBAB_ACTION_EDIT_LABELS_ID}
      component="button"
      onClick={launchLabelsModal}
      isDisabled={!canEditResource}
      data-test-action={KEBAB_ACTION_EDIT_LABELS_ID}
    >
      {t('Edit labels')}
    </DropdownItem>,
    <DropdownItem
      key={KEBAB_ACTION_EDIT_ANNOTATIONS_ID}
      component="button"
      onClick={() => launchAnnotationsModal()}
      isDisabled={!canEditResource}
      data-test-action={KEBAB_ACTION_EDIT_ANNOTATIONS_ID}
    >
      {t('Edit annotations')}
    </DropdownItem>,
    <DropdownItem
      key={KEBAB_ACTION_EDIT_ID}
      component="button"
      onClick={() => history.push(editURL)}
      isDisabled={!canEditResource}
      data-test-action={KEBAB_ACTION_EDIT_ID}
    >
      {t('Edit Pipeline')}
    </DropdownItem>,
    <DropdownItem
      key={KEBAB_ACTION_DELETE_ID}
      component="button"
      onClick={launchDeleteModal}
      isDisabled={!canDeleteResource}
      data-test-action={KEBAB_ACTION_DELETE_ID}
    >
      {t('Delete Pipeline')}
    </DropdownItem>,
  ];
  return (
    <Dropdown
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="kebab menu"
          variant="plain"
          onClick={onToggle}
          isExpanded={isOpen}
          id={KEBAB_BUTTON_ID}
          data-test={KEBAB_BUTTON_ID}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      isOpen={isOpen}
      isPlain={false}
      popperProps={{ position: 'right' }}
    >
      <DropdownList>{dropdownItems}</DropdownList>
    </Dropdown>
  );
};

export default PipelineKebab;
