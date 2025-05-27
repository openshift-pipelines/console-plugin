import * as React from 'react';
import {
  Flex,
  FlexItem,
  FormSection,
  TextInputTypes,
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { RepositoryFormValues } from './types';
import {
  detectGitType,
  getPipelineRunTemplate,
  recommendRepositoryName,
} from './repository-form-utils';
import { RepositoryModel } from '../../models';
import { FormHeader } from '../pipeline-builder/form-utils';
import InputField from '../pipelines-details/multi-column-field/InputField';
import { getBadgeFromType } from '../badges';
import { useDebounceCallback } from '../hooks/debounce';
import { ImportStrategy } from '../../types';
import { useBuilderImages } from './useBuilderImages';
import { getGitService } from '../git-services';
import { detectImportStrategies } from '../git-services/utils';
import AdvancedConfigurations from './AdvancedConfigurations';

import './RepositoryForm.scss';

const RepositoryFormSection = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const templatesRef = React.useRef({});
  const { setFieldValue } = useFormikContext<RepositoryFormValues>();

  const [builderImages] = useBuilderImages();
  const handleGitUrlChange = async (url) => {
    if (!url) {
      return;
    }
    const detectedGitType = detectGitType(url);
    const recommendedRepoName = recommendRepositoryName(url);
    if (recommendedRepoName) {
      setFieldValue('name', recommendedRepoName);
    }
    detectedGitType && setFieldValue('gitProvider', detectedGitType);
    const gitService = getGitService(url, detectedGitType);

    const importStrategyData = await detectImportStrategies(url, gitService);
    if (importStrategyData.strategies.length > 0) {
      const detectedBuildTypes = importStrategyData.strategies?.find(
        (s) => s.type === ImportStrategy.S2I,
      )?.detectedCustomData;

      const recommendedBuildType =
        builderImages &&
        detectedBuildTypes?.find(
          ({ type: recommended }) =>
            // eslint-disable-next-line no-prototype-builtins
            recommended && builderImages.hasOwnProperty(recommended),
        );

      const template: string = templatesRef.current[recommendedBuildType?.type]
        ? templatesRef.current[recommendedBuildType?.type]
        : await getPipelineRunTemplate(
            recommendedBuildType?.type,
            recommendedRepoName,
          );
      if (template) {
        templatesRef.current[recommendedBuildType?.type] = template;
        setFieldValue('yamlData', template);
      }
    }
  };
  const debouncedHandleGitUrlChange = useDebounceCallback(handleGitUrlChange);

  const title = (
    <Flex className="odc-pipeline-builder-header__content">
      <FlexItem grow={{ default: 'grow' }}>
        <Title headingLevel="h1">{t('Add Git Repository')}</Title>
      </FlexItem>
      <FlexItem>{getBadgeFromType(RepositoryModel.badge)}</FlexItem>
    </Flex>
  );

  return (
    <>
      <FormHeader title={title} />
      <FormSection className="pipelines-console-plugin__page-section-width">
        <InputField
          label={t('Git Repo URL')}
          name="gitUrl"
          type={TextInputTypes.text}
          required
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            const trimmedURL = e.target.value.trim();
            if (e.target.value !== trimmedURL) {
              debouncedHandleGitUrlChange(trimmedURL, '', '');
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            debouncedHandleGitUrlChange(e.target.value.trim(), '', '');
          }}
        />
        <InputField
          label={t('Name')}
          name="name"
          type={TextInputTypes.text}
          required
        />
        <AdvancedConfigurations />
      </FormSection>
    </>
  );
};

export default RepositoryFormSection;
