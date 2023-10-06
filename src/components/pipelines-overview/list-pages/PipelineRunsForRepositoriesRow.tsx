import * as React from 'react';
import { mainDataType } from '../utils';
import { RowProps } from '@openshift-console/dynamic-plugin-sdk';

const tableColumnClasses = ['', '', '', '', '', '', ''];

const PipelineRunsForRepositoriesRow: React.FC<RowProps<mainDataType>> = ({ obj }) => {
  return (
    <>
      <td className={tableColumnClasses[0]}>{obj.repoName}</td>
      <td className={tableColumnClasses[1]}>{obj.projectName}</td>
      <td className={tableColumnClasses[2]}>{obj.summary['runs-in-repositories']}</td>
      <td className={tableColumnClasses[3]}>{obj.summary['total-duration']}</td>
      <td className={tableColumnClasses[4]}>{obj.summary['avg-duration']}</td>
      <td className={tableColumnClasses[5]}>{obj.summary['success-rate']}</td>
      <td className={tableColumnClasses[6]}>{obj.summary['last-runtime']}</td>
    </>
  );
};

export default PipelineRunsForRepositoriesRow;
