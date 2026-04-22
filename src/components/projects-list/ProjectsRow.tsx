import {
  K8sResourceKind,
  ResourceIcon,
  Timestamp,
  useActiveNamespace,
} from '@openshift-console/dynamic-plugin-sdk';
import Status from '@openshift-console/dynamic-plugin-sdk/lib/app/components/status/Status';
import _ from 'lodash';
import type { MouseEvent, FC } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { getNameCellProps } from '@openshift-console/dynamic-plugin-sdk-internal';
import { formatNamespaceRoute } from '../pipelines-overview/utils';
import { t } from '../utils/common-utils';
import { tableColumnInfo } from './useProjectsColumns';

const getDisplayName = (obj) =>
  _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);

const getRequester = (obj: K8sResourceKind): string =>
  obj.metadata.annotations?.['openshift.io/requester'];

const isModifiedEvent = (event: MouseEvent<HTMLElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

const ProjectNameCell: FC<{ project: K8sResourceKind }> = ({ project }) => {
  const [, setActiveNamespace] = useActiveNamespace();
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
  );
};

export const getProjectsDataViewRows: GetDataViewRows<K8sResourceKind> = (
  data,
  columns,
) => {
  return data.map(({ obj: project }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ProjectNameCell project={project} />,
        props: {
          ...getNameCellProps(project.metadata.name),
          modifier: 'nowrap',
        },
      },
      [tableColumnInfo[1].id]: {
        cell: (
          <span className="co-break-word co-line-clamp">
            {getDisplayName(project) || (
              <span className="pf-v6-u-text-color-subtle">
                {t('No display name')}
              </span>
            )}
          </span>
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[2].id]: {
        cell: <Status status={project.status?.phase} />,
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[3].id]: {
        cell: getRequester(project) || (
          <span className="pf-v6-u-text-color-subtle">{t('No requester')}</span>
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={project.metadata.creationTimestamp} />,
        props: { modifier: 'nowrap' },
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell;
      const props = rowCells[id]?.props;
      return {
        id,
        props,
        cell,
      };
    });
  });
};
