import postgres from 'postgres';

const stats = async () => {
  const sql = postgres(undefined, { idle_timeout: 5 });

  const pipelineRunTypes = [
    'tekton.dev/v1beta1.PipelineRun',
    'tekton.dev/v1.PipelineRun',
  ];
  const sinceDays = 7;
  const since = new Date(
    new Date().getTime() - sinceDays * 24 * 60 * 60 * 1000,
  );
  console.log('Number of PipelineRuns since', since);

  const [{ count: all }] = await sql`
    SELECT count(*)
    FROM records
    WHERE type in (${pipelineRunTypes})
    AND (data->'status'->>'startTime')::TIMESTAMP WITH TIME ZONE > ${since}::TIMESTAMP WITH TIME ZONE
  `;
  console.log('- All PipelineRuns:', Number(all));

  const [{ count: fromPipeline }] = await sql`
    SELECT count(*)
    FROM records
    WHERE type in (${pipelineRunTypes})
    AND (data->'status'->>'startTime')::TIMESTAMP WITH TIME ZONE > ${since}::TIMESTAMP WITH TIME ZONE
    AND data->'spec'->'pipelineRef'->>'name' IS NOT NULL
  `;
  console.log('- Started from a Pipeline:', Number(fromPipeline));

  const [{ count: fromRepository }] = await sql`
    SELECT count(*)
    FROM records
    WHERE type in (${pipelineRunTypes})
    AND (data->'status'->>'startTime')::TIMESTAMP WITH TIME ZONE > ${since}::TIMESTAMP WITH TIME ZONE
    AND data->'metadata'->'labels'->>'pipelinesascode.tekton.dev/repository' IS NOT NULL
  `;
  console.log('- Started from a Repository:', Number(fromRepository));

  const [{ count: standalonePipelineRun }] = await sql`
    SELECT count(*)
    FROM records
    WHERE type in ('tekton.dev/v1beta1.PipelineRun', 'tekton.dev/v1.PipelineRun')
    AND (data->'status'->>'startTime')::TIMESTAMP WITH TIME ZONE > ${since}::TIMESTAMP WITH TIME ZONE
    AND data->'spec'->'pipelineRef'->>'name' IS NULL
    AND data->'metadata'->'labels'->>'pipelinesascode.tekton.dev/repository' IS NULL
  `;
  console.log('- Standalone PipelineRuns:', Number(standalonePipelineRun));

  await sql.end({ timeout: 5 });
};

stats();
