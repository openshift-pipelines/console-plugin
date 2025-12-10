/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash-es';
import { Button, DescriptionList } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import {
  K8sModel,
  K8sResourceCommon,
  K8sResourceKind,
  ResourceLink,
  Timestamp,
  useAccessReview,
  useAnnotationsModal,
  useLabelsModal,
} from '@openshift-console/dynamic-plugin-sdk';
import { DetailsItem } from './details-item';
import { LabelList } from './label-list';
import { referenceFor } from '../utils/k8s-utils';
import { Selector } from './selector';
import { OwnerReferences } from './owner-references';

export const pluralize = (
  i: number,
  singular: string,
  plural = `${singular}s`,
  includeCount = true,
) => {
  const pluralized = `${i === 1 ? singular : plural}`;
  return includeCount ? `${i || 0} ${pluralized}` : pluralized;
};

export const detailsPage = <T extends Record<string, any>>(
  Component: React.ComponentType<T>,
) =>
  function DetailsPage(props: T) {
    return <Component {...props} />;
  };

export const ResourceSummary: React.FC<ResourceSummaryProps> = ({
  children,
  resource,
  customPathName,
  showPodSelector = false,
  showNodeSelector = false,
  showAnnotations = true,
  showLabelEditor = true,
  canUpdateResource = true,
  podSelector = 'spec.selector',
  nodeSelector = 'spec.template.spec.nodeSelector',
  model,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { metadata } = resource;
  const reference = referenceFor(resource);
  const annotationsModalLauncher = useAnnotationsModal(resource);
  const labelsModalLauncher = useLabelsModal(resource);
  const canUpdateAccess = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    verb: 'patch',
    name: metadata.name,
    namespace: metadata.namespace,
  });
  const canUpdate = canUpdateAccess && canUpdateResource;

  return (
    <DescriptionList data-test-id="resource-summary">
      <DetailsItem
        label={t('Name')}
        obj={resource}
        path={customPathName || 'metadata.name'}
      />
      {metadata.namespace && (
        <DetailsItem
          label={t('Namespace')}
          obj={resource}
          path="metadata.namespace"
        >
          <ResourceLink
            kind="Namespace"
            name={metadata.namespace}
            title={metadata.uid}
            namespace={null}
          />
        </DetailsItem>
      )}
      <DetailsItem
        label={t('Labels')}
        obj={resource}
        path="metadata.labels"
        valueClassName="details-item__value--labels"
        onEdit={labelsModalLauncher}
        canEdit={showLabelEditor && canUpdate}
        editAsGroup
      >
        <LabelList kind={reference} labels={metadata.labels} />
      </DetailsItem>
      {showPodSelector && (
        <DetailsItem
          label={t('Pod selector')}
          obj={resource}
          path={podSelector}
        >
          <Selector
            selector={_.get(resource, podSelector)}
            namespace={_.get(resource, 'metadata.namespace')}
          />
        </DetailsItem>
      )}
      {showNodeSelector && (
        <DetailsItem
          label={t('Node selector')}
          obj={resource}
          path={nodeSelector}
        >
          <Selector kind={t('Node')} selector={_.get(resource, nodeSelector)} />
        </DetailsItem>
      )}
      {showAnnotations && (
        <DetailsItem
          label={t('Annotations')}
          obj={resource}
          path="metadata.annotations"
        >
          {canUpdate ? (
            <Button
              icon={
                <PencilAltIcon className="co-icon-space-l pf-v6-c-button-icon--plain" />
              }
              data-test="edit-annotations"
              type="button"
              isInline
              onClick={annotationsModalLauncher}
              variant="link"
            >
              {t('{{count}} annotation', {
                count: _.size(metadata.annotations),
              })}
            </Button>
          ) : (
            t('{{count}} annotation', {
              count: _.size(metadata.annotations),
            })
          )}
        </DetailsItem>
      )}
      {children}
      <DetailsItem
        label={t('Created at')}
        obj={resource}
        path="metadata.creationTimestamp"
      >
        <Timestamp timestamp={metadata.creationTimestamp} />
      </DetailsItem>
      <DetailsItem
        label={t('Owner')}
        obj={resource}
        path="metadata.ownerReferences"
      >
        <OwnerReferences resource={resource} />
      </DetailsItem>
    </DescriptionList>
  );
};

export type ResourceSummaryProps = {
  resource: K8sResourceKind;
  showPodSelector?: boolean;
  showNodeSelector?: boolean;
  showAnnotations?: boolean;
  showTolerations?: boolean;
  showLabelEditor?: boolean;
  canUpdateResource?: boolean;
  podSelector?: string;
  nodeSelector?: string;
  children?: React.ReactNode;
  customPathName?: string;
  model?: K8sModel;
};

export type ResourcePodCountProps = {
  resource: K8sResourceKind;
};

export type RuntimeClassProps = {
  obj: K8sResourceCommon;
  path?: string;
};

ResourceSummary.displayName = 'ResourceSummary';
