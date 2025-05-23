import {
  K8sResourceCommon,
  K8sResourceKind,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import * as semver from 'semver';
import { NormalizedBuilderImages } from './types';

export const imageStreamLabels = [
  'app.kubernetes.io/name',
  'app.openshift.io/runtime',
];

export const getAnnotationTags = (specTag: any) =>
  _.get(specTag, 'annotations.tags', '').split(/\s*,\s*/);

const isBuilderTag = (specTag: any) => {
  // A spec tag has annotations tags, which is a comma-delimited string (e.g., 'builder,httpd').
  const annotationTags = getAnnotationTags(specTag);
  return (
    _.includes(annotationTags, 'builder') &&
    !_.includes(annotationTags, 'hidden')
  );
};

const getStatusTags = (imageStream: K8sResourceKind): any => {
  const statusTags = _.get(imageStream, 'status.tags');
  return _.keyBy(statusTags, 'tag');
};

export const getImageStreamIcon = (tag: string): string => {
  return _.get(tag, 'annotations.iconClass');
};

export const getBuilderTags = (imageStream: K8sResourceKind): any[] => {
  const statusTags = getStatusTags(imageStream);
  return _.filter(
    imageStream.spec.tags,
    (tag) => isBuilderTag(tag) && statusTags[tag.name],
  );
};

// Sort tags in reverse order by semver, falling back to a string comparison if not a valid version.
export const getBuilderTagsSortedByVersion = (
  imageStream: K8sResourceKind,
): any[] => {
  return getBuilderTags(imageStream).sort(({ name: a }, { name: b }) => {
    const v1 = semver.coerce(a);
    const v2 = semver.coerce(b);
    if (!v1 && !v2) {
      return a.localeCompare(b);
    }
    if (!v1) {
      return 1;
    }
    if (!v2) {
      return -1;
    }
    return semver.rcompare(v1, v2);
  });
};

export const getMostRecentBuilderTag = (imageStream: K8sResourceKind) => {
  const tags = getBuilderTagsSortedByVersion(imageStream);
  return _.head(tags);
};

// An image stream is a builder image if
// - It has a spec tag annotated with `builder` and not `hidden`
// - It has a corresponding status tag
export const isBuilder = (imageStream: K8sResourceKind) =>
  !_.isEmpty(getBuilderTags(imageStream));

export const prettifyName = (name: string) => {
  return name.replace(/(-|^)([^-]?)/g, (first, prep, letter) => {
    return (prep && ' ') + letter.toUpperCase();
  });
};

export const normalizeBuilderImages = (
  imageStreams: K8sResourceCommon | K8sResourceCommon[],
): NormalizedBuilderImages => {
  const data = Array.isArray(imageStreams) ? imageStreams : [imageStreams];
  const builderImageStreams = data.filter((imageStream) =>
    isBuilder(imageStream),
  );

  return builderImageStreams.reduce(
    (builderImages: NormalizedBuilderImages, imageStream) => {
      const tags = getBuilderTagsSortedByVersion(imageStream);
      const recentTag = getMostRecentBuilderTag(imageStream);
      const { name } = imageStream.metadata;
      const displayName =
        imageStream?.metadata?.annotations?.['openshift.io/display-name'];
      const description = recentTag?.annotations?.description;
      const imageStreamNamespace = imageStream.metadata.namespace;
      const title =
        displayName && displayName.length < 14
          ? displayName
          : prettifyName(name);

      builderImages[name] = {
        obj: imageStream,
        name,
        displayName,
        description,
        title,
        tags,
        recentTag,
        imageStreamNamespace,
      };
      return builderImages;
    },
    {},
  );
};
