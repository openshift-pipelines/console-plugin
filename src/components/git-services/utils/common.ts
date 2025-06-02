export const parseGitUrl = (
  url: string,
): { name: string; owner: string; source: string; fullName: string } => {
  const cleanedUrl = url
    .replace(/^git\+/, '')
    .replace(/\.git$/, '')
    .replace(/^ssh:\/\//, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/');

  const parsed = new URL(cleanedUrl);
  const pathParts = parsed.pathname.replace(/^\/+/, '').split('/');

  if (pathParts.length < 2) {
    throw new Error(`Invalid Git URL: "${url}"`);
  }

  const name = pathParts[pathParts.length - 1];
  const owner = pathParts.slice(0, -1).join('/');
  const fullName = `${owner}/${name}`;

  return {
    name,
    owner,
    source: parsed.hostname,
    fullName,
  };
};
