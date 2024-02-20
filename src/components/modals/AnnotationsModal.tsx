import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Grid } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import TabModal from './TabModal';
import { AnnotationsModalRow } from './AnnotationsModalRow';

import './AnnotationsModal.scss';

const getIdAnnotations = (annotations: { [key: string]: string }) =>
  Object.fromEntries(
    Object.entries(annotations).map(([key, value], i) => [i, { key, value }]),
  );

export const AnnotationsModal: React.FC<{
  isOpen: boolean;
  obj: K8sResourceCommon;
  onClose: () => void;
  onSubmit: (annotations: {
    [key: string]: string;
  }) => Promise<K8sResourceCommon | void>;
}> = ({ isOpen, obj, onClose, onSubmit }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [annotations, setAnnotations] = React.useState<{
    [id: number]: { [key: string]: string };
  }>({});

  const onAnnotationAdd = () => {
    const keys = new Set([...Object.keys(annotations)]);
    let index = 0;
    while (keys.has(index.toString())) {
      index++;
    }

    setAnnotations({
      ...annotations,
      [index]: {
        key: '',
        value: '',
      },
    });
  };

  const onAnnotationsSubmit = () => {
    const uniqWith = (arr, fn) =>
      arr.filter(
        (element, index) =>
          arr.findIndex((step) => fn(element, step)) === index,
      );

    if (
      uniqWith(Object.values(annotations), (a, b) => a.key === b.key).length !==
      Object.values(annotations).length
    ) {
      return Promise.reject({ message: t('Duplicate keys found') });
    }

    const updatedAnnotations = Object.fromEntries(
      Object.entries(annotations).map(([, { key, value }]) => [key, value]),
    );

    return onSubmit(updatedAnnotations);
  };

  // reset annotations when modal is closed
  React.useEffect(() => {
    if (obj?.metadata?.annotations) {
      setAnnotations(getIdAnnotations(obj.metadata.annotations));
    }
  }, [isOpen]);

  return (
    <TabModal<K8sResourceCommon>
      headerText={t('Edit annotations')}
      isOpen={isOpen}
      obj={obj}
      onClose={onClose}
      onSubmit={onAnnotationsSubmit}
    >
      <Grid hasGutter>
        {Object.entries(annotations || {}).map(([id, { key, value }]) => (
          <AnnotationsModalRow
            onChange={(annotation) =>
              setAnnotations({
                ...annotations,
                [id]: annotation,
              })
            }
            onDelete={() =>
              setAnnotations(
                Object.fromEntries(
                  Object.entries(annotations).filter(([k]) => k !== id),
                ),
              )
            }
            annotation={{ key, value }}
            key={id}
          />
        ))}
        <div className="co-toolbar__group co-toolbar__group--left">
          <Button
            className="pf-m-link--align-left"
            icon={<PlusCircleIcon />}
            isSmall
            onClick={() => onAnnotationAdd()}
            variant="link"
          >
            {t('Add more')}
          </Button>
        </div>
      </Grid>
    </TabModal>
  );
};