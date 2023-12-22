import fs from 'fs';
import { load } from 'js-yaml';
import postgres from 'postgres';

import { toDate, toDateTime, copyDay, nextDay } from './utils/date-utils';
import {
  getNumberOfPipelinesPerDay,
  getNumberOfFailuresPerDay,
} from './utils/history-utils';

const namespace = 'test';

const pipelineRunStrings = {
  succeeded: fs.readFileSync('./yamls/PipelineRun-succeeded.yaml', {
    encoding: 'utf-8',
  }),
  failed: fs.readFileSync('./yamls/PipelineRun-failed.yaml', {
    encoding: 'utf-8',
  }),
};

const createPipelineRuns = async (startDay: Date, endDay: Date) => {
  const sql = postgres(undefined, { idle_timeout: 5 });

  await sql`DELETE FROM results WHERE parent=${namespace} AND id LIKE 'demo-data-%'`;
  await sql`DELETE FROM records WHERE parent=${namespace} AND id LIKE 'demo-data-%'`;

  let targetNumberOfPipelineRuns = 0;
  for (
    let day = copyDay(startDay);
    day.getTime() < endDay.getTime();
    day = nextDay(day)
  ) {
    targetNumberOfPipelineRuns += getNumberOfPipelinesPerDay(day);
  }
  console.log(
    `Will create ${targetNumberOfPipelineRuns} PipelineRuns between ${toDate(
      startDay,
    )} and ${toDate(endDay)}`,
  );

  let createdNumberOfPipelineRuns = 0;
  for (
    let day = copyDay(startDay);
    day.getTime() < endDay.getTime();
    day = nextDay(day)
  ) {
    const numberOfPipelines = getNumberOfPipelinesPerDay(day);
    const numberOfFailures = getNumberOfFailuresPerDay(day);

    console.log(
      `day: ${toDate(
        day,
      )} / numberOfPipelines: ${numberOfPipelines} / numberOfFailures: ${numberOfFailures}`,
    );

    for (let i = 0; i < numberOfPipelines; i++) {
      // Do all the PipelineRuns between 8am and 8pm
      const startWorkingTimeInMinutes = 8 * 60;
      const endWorkingTimeInMinutes = 20 * 60;
      const durationInMinutes = numberOfPipelines + (i % 5);
      const failure = i % (numberOfPipelines / numberOfFailures) === 0;
      // console.log(
      //   `startWorkingTimeInMinutes: ${startWorkingTimeInMinutes} / endWorkingTimeInMinutes: ${endWorkingTimeInMinutes} / durationInMinutes: ${durationInMinutes}`,
      // );

      const creationTimestamp = new Date(
        day.getTime() +
          (startWorkingTimeInMinutes +
            (endWorkingTimeInMinutes - startWorkingTimeInMinutes) *
              (i / numberOfPipelines)) *
            60 *
            1000,
      );
      const completionTimestamp = new Date(
        creationTimestamp.getTime() + durationInMinutes * 60 * 1000,
      );
      // console.log(
      //   `creationTimestamp: ${toDateTime(
      //     creationTimestamp,
      //   )} / completionTimestamp: ${toDateTime(
      //     completionTimestamp,
      //   )} / durationInMinutes: ${durationInMinutes} / failure: ${failure}`,
      // );

      const creationTimestampAsKey = creationTimestamp
        .toISOString()
        .replace(/[^0-9]/g, '');
      const id = 'demo-data-' + creationTimestampAsKey;

      const pipelineName = 'demo-data';
      const pipelineRunName = 'demo-data-' + creationTimestampAsKey;
      const pipelineRunWithVariables = failure
        ? pipelineRunStrings.failed
        : pipelineRunStrings.succeeded;

      const pipelineRun = load(
        pipelineRunWithVariables
          .replace(/\$NAMESPACE/g, namespace)
          .replace(/\$PIPELINE_NAME/g, pipelineName)
          .replace(/\$PIPELINERUN_NAME/g, pipelineRunName)
          .replace(
            /\$CREATIONTIMESTAMP/g,
            '"' + creationTimestamp.toISOString() + '"',
          )
          .replace(
            /\$COMPLETIONTIMESTAMP/g,
            '"' + completionTimestamp.toISOString() + '"',
          ),
      );
      // console.log(pipelineRun);

      await sql`INSERT INTO results ${sql({
        parent: namespace,
        id: id,
      })}`;
      await sql`INSERT INTO records ${sql({
        parent: namespace,
        id: id,
        result_id: id,
        // result_name: '',
        type: 'tekton.dev/v1beta1.PipelineRun',
        data: pipelineRun,
        // name: '',
        // etag: '',
        created_time: creationTimestamp,
        updated_time: completionTimestamp,
      })}`;

      createdNumberOfPipelineRuns++;
    }
  }

  console.log(
    `Create ${createdNumberOfPipelineRuns} / ${targetNumberOfPipelineRuns} PipelineRuns between ${toDate(
      startDay,
    )} and ${toDate(endDay)}`,
  );
};

// Currently the UI can show the last 4 weeks only.
const last4WeeksInMinutes = 4 * 7 * 24 * 60;
const startDay = new Date(
  new Date().getTime() - last4WeeksInMinutes * 60 * 1000,
);
const endDay = new Date();
createPipelineRuns(startDay, endDay);
