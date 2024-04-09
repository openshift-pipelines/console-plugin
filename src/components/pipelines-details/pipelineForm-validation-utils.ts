import * as yup from 'yup';
import { t } from '../utils/common-utils';

export const resourcesValidationSchema = () =>
  yup.object().shape({
    resources: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('Required')),
        type: yup.string().required(t('Required')),
      }),
    ),
  });

export const parametersValidationSchema = () =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('Required')),
        description: yup.string(),
        default: yup.string(),
      }),
    ),
  });
