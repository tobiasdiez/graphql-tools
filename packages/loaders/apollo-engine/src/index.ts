import { SchemaLoader, Source, SingleFileOptions, AggregateError } from '@graphql-tools/utils';
import { fetch } from 'cross-fetch';
import { buildClientSchema } from 'graphql';
import { SCHEMA_QUERY } from './SCHEMA_QUERY';

/**
 * Additional options for loading from Apollo Engine
 */
export interface ApolloEngineOptions extends SingleFileOptions {
  engine: {
    endpoint?: string;
    apiKey: string;
  };
  graph: string;
  variant: string;
  headers?: Record<string, string>;
}

const DEFAULT_APOLLO_ENDPOINT = 'https://engine-graphql.apollographql.com/api/graphql';

/**
 * This loader loads a schema from Apollo Engine
 */
export class ApolloEngineLoader implements SchemaLoader<ApolloEngineOptions> {
  loaderId() {
    return 'apollo-engine';
  }

  async canLoad(ptr: string) {
    return typeof ptr === 'string' && ptr === 'apollo-engine';
  }

  canLoadSync() {
    return false;
  }

  async load(_: 'apollo-engine', options: ApolloEngineOptions): Promise<Source> {
    const response = await fetch(options.engine.endpoint || DEFAULT_APOLLO_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': options.engine.apiKey,
        'apollo-client-name': 'Apollo Language Server',
        'apollo-client-reference-id': '146d29c0-912c-46d3-b686-920e52586be6',
        'apollo-client-version': '2.6.8',
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      body: JSON.stringify({
        query: SCHEMA_QUERY,
        variables: {
          id: options.graph,
          tag: options.variant,
        },
      }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      throw new AggregateError(errors);
    }

    if (!data?.service?.schema) {
      throw new Error('Unable to download schema from Apollo Engine');
    }

    return {
      location: 'apollo-engine',
      schema: buildClientSchema(data.service.schema),
    };
  }

  loadSync(): never {
    throw new Error('Loader ApolloEngine has no sync mode');
  }
}
