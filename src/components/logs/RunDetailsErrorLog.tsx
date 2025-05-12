import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { CombinedErrorDetails } from './log-snippet-types';
import LogSnippetBlock from './LogSnippetBlock';

type RunDetailErrorLogProps = {
  logDetails: CombinedErrorDetails;
  namespace: string;
};

const RunDetailsErrorLog: React.FC<RunDetailErrorLogProps> = ({
  logDetails,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!logDetails) {
    return null;
  }

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Message')}</DescriptionListTerm>
        <DescriptionListDescription>
          {logDetails.title}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('Log snippet')}</DescriptionListTerm>
        <DescriptionListDescription>
          <LogSnippetBlock logDetails={logDetails} namespace={namespace}>
            {(logSnippet: string) => <pre className="co-pre">{logSnippet}</pre>}
          </LogSnippetBlock>
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default RunDetailsErrorLog;
