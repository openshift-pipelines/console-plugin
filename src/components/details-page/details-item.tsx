import * as React from 'react';
import * as _ from 'lodash-es';
import Linkify from 'react-linkify';
import { useTranslation } from 'react-i18next';
import classnames from 'classnames';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTermHelpText,
  DescriptionListTermHelpTextButton,
  Popover,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  K8sModel,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import './details-item.scss';

export const PropertyPath: React.FC<{
  kind: string;
  path: string | string[];
}> = ({ kind, path }) => {
  const pathArray: string[] = _.toPath(path);
  return (
    <Breadcrumb className="co-breadcrumb">
      <BreadcrumbItem>{kind}</BreadcrumbItem>
      {pathArray.map((property, i) => {
        const isLast = i === pathArray.length - 1;
        return (
          <BreadcrumbItem key={i} isActive={isLast}>
            {property}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
};

const EditButton: React.SFC<EditButtonProps> = (props) => {
  return (
    <Button
      icon={
        <PencilAltIcon className="co-icon-space-l pf-v6-c-button-icon--plain" />
      }
      type="button"
      variant="link"
      isInline
      onClick={props.onClick}
      data-test={
        props.testId
          ? `${props.testId}-details-item__edit-button`
          : 'details-item__edit-button'
      }
    >
      {props.children}
    </Button>
  );
};

export const LinkifyExternal: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
    {children}
  </Linkify>
);

export const DetailsItem: React.FC<DetailsItemProps> = ({
  children,
  defaultValue = '-',
  description,
  editAsGroup,
  hideEmpty,
  label,
  labelClassName,
  obj,
  onEdit,
  canEdit = true,
  path,
  valueClassName,
  model,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const hide = hideEmpty && _.isEmpty(_.get(obj, path));
  const popoverContent: string = description;
  const value: React.ReactNode = children || _.get(obj, path, defaultValue);
  const editable = onEdit && canEdit;
  return hide ? null : (
    <>
      <DescriptionListGroup>
        <DescriptionListTermHelpText
          data-test-selector={`details-item-label__${label}`}
          className={labelClassName}
        >
          <Split>
            <SplitItem className="details-item__label">
              {popoverContent || path ? (
                <Popover
                  headerContent={<div>{label}</div>}
                  {...(popoverContent && {
                    bodyContent: (
                      <LinkifyExternal>
                        <div className="co-pre-line">{popoverContent}</div>
                      </LinkifyExternal>
                    ),
                  })}
                  {...(path && {
                    footerContent: (
                      <PropertyPath kind={model?.kind} path={path} />
                    ),
                  })}
                  maxWidth="30rem"
                >
                  <DescriptionListTermHelpTextButton data-test={label}>
                    {label}
                  </DescriptionListTermHelpTextButton>
                </Popover>
              ) : (
                label
              )}
            </SplitItem>
            {editable && editAsGroup && (
              <>
                <SplitItem isFilled />
                <SplitItem>
                  <EditButton testId={label} onClick={onEdit}>
                    {t('Edit')}
                  </EditButton>
                </SplitItem>
              </>
            )}
          </Split>
        </DescriptionListTermHelpText>
        <DescriptionListDescription
          className={classnames(valueClassName, {
            'details-item__value--group': editable && editAsGroup,
          })}
          data-test-selector={`details-item-value__${label}`}
        >
          {editable && !editAsGroup ? (
            <EditButton testId={label} onClick={onEdit}>
              {value}
            </EditButton>
          ) : (
            value
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </>
  );
};

export type DetailsItemProps = {
  canEdit?: boolean;
  defaultValue?: React.ReactNode;
  description?: string;
  editAsGroup?: boolean;
  hideEmpty?: boolean;
  label: string;
  labelClassName?: string;
  obj?: K8sResourceKind;
  onEdit?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  path?: string | string[];
  valueClassName?: string;
  model?: K8sModel;
};

type EditButtonProps = {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  testId?: string;
};

DetailsItem.displayName = 'DetailsItem';
PropertyPath.displayName = 'PropertyPath';
EditButton.displayName = 'EditButton';
