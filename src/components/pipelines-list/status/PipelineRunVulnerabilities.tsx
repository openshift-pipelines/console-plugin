import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  CriticalRiskIcon,
  AngleDoubleDownIcon,
  AngleDoubleUpIcon,
  EqualsIcon,
} from '@patternfly/react-icons/dist/js/icons';
import { t_chart_color_blue_300 as blueColor } from "@patternfly/react-tokens/dist/js/t_chart_color_blue_300";
import { t_chart_color_orange_400 as goldColor } from "@patternfly/react-tokens/dist/js/t_chart_color_orange_400";
import { t_chart_color_orange_300 as orangeColor } from "@patternfly/react-tokens/dist/js/t_chart_color_orange_300";
import { t_chart_global_danger_color_100 as redColor } from "@patternfly/react-tokens/dist/js/t_chart_global_danger_color_100";
import { PipelineRunKind } from '../../../types';
import { usePipelineRunVulnerabilities } from '../../hooks/usePipelineRunVulnerabilities';

import './PipelineRunVulnerabilities.scss';

export const CriticalIcon = () => (
  <CriticalRiskIcon title="Critical" color={redColor.value} />
);
export const HighIcon = () => (
  <AngleDoubleUpIcon title="High" color={orangeColor.value} />
);
export const MediumIcon = () => (
  <EqualsIcon title="Medium" color={goldColor.value} />
);
export const LowIcon = () => (
  <AngleDoubleDownIcon title="Low" color={blueColor.value} />
);

type PipelineRunVulnerabilitiesProps = {
  pipelineRun: PipelineRunKind;
  condensed?: boolean;
};

const PipelineRunVulnerabilities: React.FC<PipelineRunVulnerabilitiesProps> = ({
  pipelineRun,
  condensed,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const scanResults = usePipelineRunVulnerabilities(pipelineRun);

  return scanResults?.vulnerabilities ? (
    <div
      className="opp-vulnerabilities"
      data-test={`${pipelineRun?.metadata?.name}-vulnerabilities`}
    >
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <CriticalIcon />
          {!condensed ? t('Critical') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.critical}
        </span>
      </div>
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <HighIcon />
          {!condensed ? t('High') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.high}
        </span>
      </div>
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <MediumIcon />
          {!condensed ? t('Medium') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.medium}
        </span>
      </div>
      <div className="opp-vulnerabilities__severity">
        <span className="opp-vulnerabilities__severity-status">
          <LowIcon />
          {!condensed ? t('Low') : null}
        </span>
        <span className="opp-vulnerabilities__severity-count">
          {scanResults.vulnerabilities.low}
        </span>
      </div>
    </div>
  ) : (
    <div>-</div>
  );
};

export default PipelineRunVulnerabilities;
