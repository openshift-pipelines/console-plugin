import {
  K8sResourceKind,
  ResourceIcon,
  RowProps,
  TableData,
  Timestamp,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router-dom-v5-compat';
import { formatNamespaceRoute } from '../pipelines-overview/utils';

const getDisplayName = (obj) =>
  _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);

const getRequester = (obj: K8sResourceKind): string =>
  obj.metadata.annotations?.['openshift.io/requester'];

// Check for a modified mouse event. For example - Ctrl + Click
const isModifiedEvent = (event: React.MouseEvent<HTMLElement>) => {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
};

const ProjectsRow: React.FC<RowProps<K8sResourceKind>> = ({
  obj: project,
  activeColumnIDs,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [, setActiveNamespace] = useActiveNamespace();
  const requester = getRequester(project);
  const location = useLocation();
  const basePath = location?.pathname;
  const [URLSearchParams] = useSearchParams();

  const newUrl = {
    search: `?${URLSearchParams.toString()}`,
    hash: location?.hash,
  };

  const handleClick = (e) => {
    // Don't set last namespace if its modified click (Ctrl+Click).
    if (isModifiedEvent(e)) {
      return;
    }
    setActiveNamespace(project.metadata.name);
  };

  const namespacedPath = formatNamespaceRoute(
    project.metadata.name,
    basePath,
    newUrl,
  );

  return (
    <>
      <TableData id="name" activeColumnIDs={activeColumnIDs}>
        <span className="co-resource-item co-resource-item--truncate">
          <ResourceIcon kind="Project" />
          <Link
            to={namespacedPath}
            className="co-resource-item__resource-name"
            onClick={handleClick}
          >
            {project.metadata.name}
          </Link>
        </span>
      </TableData>
      <TableData id="display-name" activeColumnIDs={activeColumnIDs}>
        <span className="co-break-word co-line-clamp">
          {getDisplayName(project) || (
            <span className="text-muted">{t('No display name')}</span>
          )}
        </span>
      </TableData>
      <TableData id="status" activeColumnIDs={activeColumnIDs}>
        <Status status={project.status?.phase} />
      </TableData>
      <TableData id="requester" activeColumnIDs={activeColumnIDs}>
        {requester || <span className="text-muted">{t('No requester')}</span>}
      </TableData>
      <TableData id="created" activeColumnIDs={activeColumnIDs}>
        <Timestamp timestamp={project.metadata.creationTimestamp} />
      </TableData>
    </>
  );
};

export default ProjectsRow;
