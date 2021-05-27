import { mergeTypeDefs, TypeDefs } from '@graphql-tools/merge';

export function concatenateTypeDefs(
  typeDefs: TypeDefs
): string {
  return mergeTypeDefs(typeDefs, { commentDescriptions: true })
}
