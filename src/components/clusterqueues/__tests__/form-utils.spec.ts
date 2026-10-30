import { JSON_SCHEMA, load } from 'js-yaml';
import { cloneDeep, set, unset } from 'lodash-es';
import { t } from '../../../../__mocks__/react-i18next';
import {
  convertClusterQueueFormToYAML,
  convertClusterQueueToForm,
  convertFormToClusterQueue,
  createClusterQueueFlavor,
  createInitialClusterQueueValues,
  parseClusterQueueYAML,
} from '../form-utils';
import { clusterQueueFormSchema } from '../validation-utils';

const yaml = `apiVersion: kueue.x-k8s.io/v1beta2
kind: ClusterQueue
metadata:
  name: fleet-cq
  creationTimestamp: 2026-10-29T10:00:00Z
  labels: {team: platform}
spec:
  cohortName: platform
  namespaceSelector: {}
  preemption: {withinClusterQueue: Never}
  resourceGroups:
  - coveredResources: [cpu, memory]
    flavors:
    - name: default-flavor
      resources:
      - {name: cpu, nominalQuota: 4, borrowingLimit: 1}
      - {name: memory, nominalQuota: 8Gi, lendingLimit: 2Gi}
`;
const source = load(yaml, { schema: JSON_SCHEMA });
const group = source.spec.resourceGroups[0];
const flavor = group.flavors[0];
const pipelineQuota = { name: 'tekton.dev/pipelineruns', nominalQuota: '2' };
const schema = clusterQueueFormSchema(t);

describe('ClusterQueue form data', () => {
  it('starts with the UX defaults and matching cluster-scoped YAML', () => {
    const { formData, yamlData } = createInitialClusterQueueValues();
    expect(formData).toMatchObject({
      name: '',
      cohort: '',
      queueingStrategy: 'BestEffortFIFO',
      flavors: [{ name: '', cpu: '4', memory: '8Gi' }],
    });
    const resource = load(yamlData);
    expect(resource.metadata).toEqual({ name: '' });
    expect(resource.spec.namespaceSelector).toEqual({});
    expect(
      convertFormToClusterQueue(parseClusterQueueYAML(yamlData, t)),
    ).toEqual(resource);
  });

  it('round-trips YAML and edits form fields without losing other settings or mutating the source', () => {
    const form = parseClusterQueueYAML(yaml, t);
    expect(load(convertClusterQueueFormToYAML(form))).toEqual(source);
    form.name = 'release-cq';
    form.cohort = '';
    form.queueingStrategy = 'StrictFIFO';
    form.flavors[0].name = 'gpu-flavor';
    form.flavors[0].cpu = '8';
    const expected = cloneDeep(source);
    expected.metadata.name = form.name;
    delete expected.spec.cohortName;
    expected.spec.queueingStrategy = 'StrictFIFO';
    expected.spec.resourceGroups[0].flavors[0].name = 'gpu-flavor';
    expected.spec.resourceGroups[0].flavors[0].resources[0].nominalQuota = '8';
    expect(convertFormToClusterQueue(form)).toEqual(expected);
    expect(form.resource).toEqual(source);
  });

  it('adds and removes rows while keeping existing limits attached to their flavor', () => {
    const form = parseClusterQueueYAML(yaml, t);
    form.flavors.unshift({ ...createClusterQueueFlavor(), name: 'arm-flavor' });
    const flavors =
      convertFormToClusterQueue(form).spec.resourceGroups[0].flavors;
    expect(flavors[0]).toEqual({
      name: 'arm-flavor',
      resources: [
        { name: 'cpu', nominalQuota: '4' },
        { name: 'memory', nominalQuota: '8Gi' },
      ],
    });
    expect(flavors[1]).toEqual(flavor);
    form.flavors.pop();
    expect(
      convertFormToClusterQueue(form).spec.resourceGroups[0].flavors,
    ).toEqual([flavors[0]]);
    form.flavors = [];
    expect(convertFormToClusterQueue(form).spec.resourceGroups).toEqual([]);
  });

  it('retains incomplete quota rows when switching through YAML', () => {
    const { formData } = createInitialClusterQueueValues();
    formData.name = 'fleet-cq';
    formData.flavors.push(createClusterQueueFlavor());

    const roundTripped = parseClusterQueueYAML(
      convertClusterQueueFormToYAML(formData),
      t,
    );
    expect(roundTripped.flavors).toMatchObject(formData.flavors);
    expect(schema.isValidSync(roundTripped)).toBe(false);
  });

  it.each([
    'spec.namespaceSelector',
    'spec.resourceGroups[0].flavors[0].resources[0].nominalQuota',
  ])('preserves missing and null values at %s', (path) => {
    const resource = cloneDeep(source);
    unset(resource, path);
    expect(
      convertFormToClusterQueue(convertClusterQueueToForm(resource, t)),
    ).toEqual(resource);
    set(resource, path, null);
    expect(
      convertFormToClusterQueue(convertClusterQueueToForm(resource, t)),
    ).toEqual(resource);
  });

  it('keeps CPU and memory in the order specified by the resource group', () => {
    const resource = cloneDeep(source);
    resource.spec.resourceGroups[0].coveredResources.reverse();
    resource.spec.resourceGroups[0].flavors[0].resources.reverse();
    const form = convertClusterQueueToForm(resource, t);
    form.flavors[0].cpu = '500m';
    resource.spec.resourceGroups[0].flavors[0].resources[1].nominalQuota =
      '500m';
    expect(convertFormToClusterQueue(form)).toEqual(resource);
  });

  it.each([
    [
      'spec.resourceGroups[0]',
      {
        coveredResources: [...group.coveredResources, pipelineQuota.name],
        flavors: [
          { ...flavor, resources: [...flavor.resources, pipelineQuota] },
        ],
      },
    ],
    [
      'spec.resourceGroups[1]',
      {
        coveredResources: [pipelineQuota.name],
        flavors: [
          {
            name: 'pipeline-flavor',
            resources: [pipelineQuota],
          },
        ],
      },
    ],
  ])(
    'retains YAML-only settings at %s when changing other form fields',
    (path, value) => {
      const resource = set(cloneDeep(source), path, value);
      const form = convertClusterQueueToForm(resource, t);
      expect(form.flavors).toEqual([]);
      expect(schema.isValidSync(form)).toBe(true);
      form.cohort = 'release';
      expect(convertFormToClusterQueue(form)).toEqual({
        ...resource,
        spec: { ...resource.spec, cohortName: 'release' },
      });
    },
  );

  it.each([
    '',
    'spec: [',
    yaml.replace('v1beta2', 'v1beta1'),
    yaml.replace('kind: ClusterQueue', 'kind: LocalQueue'),
    yaml.replace('name: fleet-cq', 'name: [fleet-cq]'),
    yaml.replace('metadata:', 'metadata:\n  namespace: demo'),
  ])('rejects invalid YAML or incompatible documents (%#)', (input) => {
    expect(() => parseClusterQueueYAML(input, t)).toThrow();
  });

  it.each([
    ['name', 'fleet.example', true],
    ['name', 'Bad_Name', false],
    ['name', '', false],
    ['name', 'a'.repeat(254), false],
    ['cohort', '', true],
    ['cohort', 'bad cohort', false],
    ['queueingStrategy', 'StrictFIFO', true],
    ['queueingStrategy', 'Unknown', false],
    ['flavors[0].cpu', '500m', true],
    ['flavors[0].cpu', '0', true],
    ['flavors[0].memory', '-1Gi', false],
    ['flavors[0].memory', '8GB', false],
    ['flavors[0].memory', '', false],
    ['flavors[0].name', '', false],
    ['flavors', [], false],
  ])('validates %s = %p', (path, value, valid) => {
    const form = set(parseClusterQueueYAML(yaml, t), path, value);
    expect(schema.isValidSync(form)).toBe(valid);
  });

  it('reports duplicate flavors on the row and enforces the 64-flavor limit', () => {
    const form = parseClusterQueueYAML(yaml, t);
    form.flavors.push({ ...form.flavors[0] });
    expect(() => schema.validateSync(form)).toThrow(
      expect.objectContaining({ path: 'flavors[1].name' }),
    );
    form.flavors = Array.from({ length: 65 }, (_, i) => ({
      ...createClusterQueueFlavor(),
      name: `flavor-${i}`,
    }));
    expect(schema.isValidSync(form)).toBe(false);
    form.flavors.pop();
    expect(schema.isValidSync(form)).toBe(true);
  });
});
