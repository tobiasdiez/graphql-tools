export const SCHEMA_QUERY = /* GraphQL */ `
  query GetGraphQLSchemaForGraphQLTools($owner: String!, $name: String!, $expression: String!) {
    repository(owner: $owner, name: $name) {
      object(expression: $expression) {
        ... on Blob {
          text
        }
      }
    }
  }
`;
export const SCHEMA_QUERY_OPERATION_NAME = `GetGraphQLSchemaForGraphQLTools`;
