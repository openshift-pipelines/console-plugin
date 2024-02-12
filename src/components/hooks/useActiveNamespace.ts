import { useLocation } from 'react-router-dom';
import { ALL_NAMESPACES_KEY } from '../../consts';

const basePathPattern = new RegExp(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  `^/?${(window as any).SERVER_FLAGS.basePath}`,
);
const stripBasePath = (path: string): string =>
  path.replace(basePathPattern, '/');
export const legalNamePattern = /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/;

const getNamespace = (path: string): string => {
  path = stripBasePath(path);
  const split = path.split('/').filter((x) => x);

  if (split[1] === 'all-namespaces') {
    return ALL_NAMESPACES_KEY;
  }

  let ns: string;
  if (
    split[1] === 'cluster' &&
    ['namespaces', 'projects'].includes(split[2]) &&
    split[3]
  ) {
    ns = split[3];
  } else if (split[1] === 'ns' && split[2]) {
    ns = split[2];
  } else {
    return;
  }

  const match = ns.match(legalNamePattern);
  return match && match.length > 0 && match[0];
};

export const useActiveNamespace = (): [string] => {
  const { pathname } = useLocation();
  const activeNamespace = getNamespace(pathname);
  return [activeNamespace];
};

export default useActiveNamespace;
