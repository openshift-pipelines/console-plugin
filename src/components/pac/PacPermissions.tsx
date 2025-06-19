import * as React from 'react';
import {
  FormGroup,
  ExpandableSection,
  Grid,
  GridItem,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

const PacPermissions: React.FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <ExpandableSection
      toggleText={t('See GitHub permissions')}
      onToggle={() => setIsOpen(!isOpen)}
      isExpanded={isOpen}
    >
      <Grid hasGutter span={6}>
        <GridItem>
          <FormGroup
            label={t('Repository Permissions:')}
            fieldId="repo-permissions"
          >
            <Text component={TextVariants.small}>
              {t('Checks: Read & Write')}
              <br />
              {t('Contents: Read & Write')}
              <br />
              {t('Issues: Read & Write')}
              <br />
              {t('Members: Readonly')}
              <br />
              {t('Metadata: Readonly')}
              <br />
              {t('Organization plan: Readonly')}
              <br />
              {t('Pull requests: Read & Write')}
            </Text>
          </FormGroup>
        </GridItem>
        <GridItem>
          <FormGroup
            label={t('Organization permissions:')}
            fieldId="org-permissions"
          >
            <Text component={TextVariants.small}>
              {t('Members: Readonly')}
              <br />
              {t('Plan: Readonly')}
            </Text>
          </FormGroup>
        </GridItem>
        <GridItem>
          <FormGroup
            label={t('Subscribe to events:')}
            fieldId="event-subscriptions"
          >
            <Text component={TextVariants.small}>
              {t('Commit comment')}
              <br />
              {t('Issue comment')}
              <br />
              {t('Pull request')}
              <br />
              {t('Pull request review')}
              <br />
              {t('Pull request review comment')}
              <br />
              {t('Push')}
            </Text>
          </FormGroup>
        </GridItem>
      </Grid>
    </ExpandableSection>
  );
};

export default PacPermissions;
