import { UniversalLoader, parseGraphQLSDL, parseGraphQLJSON, SingleFileOptions } from '@graphql-tools/utils';
import { fetch } from 'cross-fetch';
import { GraphQLTagPluckOptions, gqlPluckFromCodeString } from '@graphql-tools/graphql-tag-pluck';
import { SCHEMA_QUERY, SCHEMA_QUERY_OPERATION_NAME } from './SCHEMA_QUERY';

// github:owner/name#ref:path/to/file
function extractData(
  pointer: string
): {
  owner: string;
  name: string;
  ref: string;
  path: string;
} {
  const [repo, file] = pointer.split('#');
  const [owner, name] = repo.split(':')[1].split('/');
  const [ref, path] = file.split(':');

  return {
    owner,
    name,
    ref,
    path,
  };
}

/**
 * Additional options for loading from GitHub
 */
export interface GithubLoaderOptions extends SingleFileOptions {
  /**
   * A GitHub access token
   */
  token: string;
  /**
   * Additional options to pass to `graphql-tag-pluck`
   */
  pluckConfig?: GraphQLTagPluckOptions;
}

/**
 * This loader loads a file from GitHub.
 *
 * ```js
 * const typeDefs = await loadTypedefs('github:githubUser/githubRepo#branchName:path/to/file.ts', {
 *   loaders: [new GithubLoader()],
 *   token: YOUR_GITHUB_TOKEN,
 * })
 * ```
 */
export class GithubLoader implements UniversalLoader<GithubLoaderOptions> {
  loaderId() {
    return 'github-loader';
  }

  async canLoad(pointer: string) {
    return typeof pointer === 'string' && pointer.toLowerCase().startsWith('github:');
  }

  canLoadSync() {
    return false;
  }

  async load(pointer: string, options: GithubLoaderOptions) {
    const { owner, name, ref, path } = extractData(pointer);
    const expression = `${ref}:${path}`;
    const request = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `bearer ${options.token}`,
      },
      body: JSON.stringify({
        query: SCHEMA_QUERY,
        variables: {
          owner,
          name,
          expression,
        },
        operationName: SCHEMA_QUERY_OPERATION_NAME,
      }),
    });
    const { data, errors } = await request.json();

    if (errors?.length) {
      throw new AggregateError(errors);
    }

    if (!data?.repository?.object?.text) {
      throw new Error('Unable to download schema from GitHub');
    }

    const content = data.repository.object.text;

    if (/\.(gql|graphql)s?$/i.test(path)) {
      return parseGraphQLSDL(pointer, content, options);
    }

    if (/\.json$/i.test(path)) {
      return parseGraphQLJSON(pointer, content, options);
    }

    const rawSDL = await gqlPluckFromCodeString(pointer, content, options.pluckConfig);
    if (rawSDL) {
      return {
        location: pointer,
        rawSDL,
      };
    }

    throw new Error(`Invalid file extension: ${path}`);
  }

  loadSync(): never {
    throw new Error('Loader GitHub has no sync mode');
  }
}
