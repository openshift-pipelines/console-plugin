import * as yup from 'yup';
import { VolumeTypes } from '../../consts';
import { TektonParam } from '../../types';
import { t } from '../utils/common-utils';

export const CREATE_PIPELINE_RESOURCE = '#CREATE_PIPELINE_RESOURCE#';
export enum PipelineResourceType {
  git = 'git',
  image = 'image',
  cluster = 'cluster',
  storage = 'storage',
}

export const paramIsRequired = (param: TektonParam): boolean => {
  return !('default' in param);
};

export const formResources = () =>
  yup.array().of(
    yup.object().shape({
      name: yup.string().required(t('Required')),
      selection: yup.string().required(t('Required')),
      data: yup.object().when('selection', () => {
        if (CREATE_PIPELINE_RESOURCE) {
          return validateResourceType();
        }
      }),
    }),
  );

const volumeTypeSchema = () =>
  yup
    .object()
    .when('type', ([type]) => {
      if (VolumeTypes[type] === VolumeTypes.Secret) {
        return yup.object().shape({
          secret: yup.object().shape({
            secretName: yup.string().required(t('Required')),
            items: yup.array().of(
              yup.object().shape({
                key: yup.string().required(t('Required')),
                path: yup.string().required(t('Required')),
              }),
            ),
          }),
        });
      }
    })
    .when('type', ([type]) => {
      if (VolumeTypes[type] === VolumeTypes.ConfigMap) {
        return yup.object().shape({
          configMap: yup.object().shape({
            name: yup.string().required(t('Required')),
            items: yup.array().of(
              yup.object().shape({
                key: yup.string().required(t('Required')),
                path: yup.string().required(t('Required')),
              }),
            ),
          }),
        });
      }
    })
    .when('type', ([type]) => {
      if (VolumeTypes[type] === VolumeTypes.PVC) {
        return yup.object().shape({
          persistentVolumeClaim: yup.object().shape({
            claimName: yup.string().required(t('Required')),
          }),
        });
      }
    })
    .when('type', ([type]) => {
      if (VolumeTypes[type] === VolumeTypes.VolumeClaimTemplate) {
        return yup.object().shape({
          volumeClaimTemplate: yup.object().shape({
            spec: yup.object().shape({
              accessModes: yup.array().of(yup.string().required(t('Required'))),
              resources: yup.object().shape({
                requests: yup.object().shape({
                  storage: yup.string().required(t('Required')),
                }),
              }),
              storageClassName: yup.string().required(t('Required')),
              volumeMode: yup.string().required(t('Required')),
            }),
          }),
        });
      }
    });

export const validateResourceType = () =>
  yup.object().shape({
    type: yup.string().required(t('Required')),
    params: yup
      .object()
      .when('type', () => {
        if (PipelineResourceType.git) {
          return yup.object({
            url: yup.string().required(t('Required')),
            revision: yup.string(),
          });
        }
      })
      .when('type', () => {
        if (PipelineResourceType.image) {
          return yup.object({
            url: yup.string().required(t('Required')),
          });
        }
      })
      .when('type', () => {
        if (PipelineResourceType.storage) {
          return yup.object({
            type: yup.string().required(t('Required')),
            location: yup.string().required(t('Required')),
            dir: yup.string(),
          });
        }
      })
      .when('type', () => {
        if (PipelineResourceType.cluster) {
          return yup.object({
            name: yup.string().required(t('Required')),
            url: yup.string().required(t('Required')),
            username: yup.string().required(t('Required')),
            password: yup.string(),
            insecure: yup.string(),
          });
        }
      }),
    secrets: yup.object().when('type', () => {
      if (PipelineResourceType.cluster) {
        return yup.object({
          cadata: yup.string().required(t('Required')),
          token: yup.string(),
        });
      }
    }),
  });

const commonPipelineSchema = () =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('Required')),
        default: yup.string(),
        description: yup.string(),
        value: yup
          .string()
          .test(
            'test-if-param-can-be-empty',
            t('Required'),
            function (value: string) {
              return paramIsRequired(this.parent) ? !!value : true;
            },
          ),
      }),
    ),
    resources: formResources(),
    workspaces: yup.array().of(
      yup.object().shape({
        type: yup.string().required(t('Required')),
        data: volumeTypeSchema(),
      }),
    ),
    timeouts: yup.object().shape({
      timeValue: yup
        .number()
        .min(0, t('Timeout must be greater than or equal to 0.')),
    }),
  });

export const startPipelineSchema = () =>
  commonPipelineSchema().shape({
    secretOpen: yup.boolean().equals([false]),
  });

export const advancedSectionValidationSchema = () =>
  yup.object().shape({
    secretName: yup.string().required(t('Required')),
    type: yup.string().required(t('Required')),
    annotations: yup.object().shape({
      key: yup.string().required(t('Required')),
      value: yup.string().required(t('Required')),
    }),
  });

export const addTriggerSchema = () =>
  commonPipelineSchema().shape({
    triggerBinding: yup.object().shape({
      name: yup.string().required(t('Required')),
      resource: yup
        .object()
        .shape({
          metadata: yup.object().shape({
            name: yup.string().required(t('Required')),
          }),
        })
        .required(t('Required')),
    }),
  });

export const removeTriggerSchema = () =>
  yup.object().shape({
    selectedTrigger: yup.string().required(t('Required')),
  });
