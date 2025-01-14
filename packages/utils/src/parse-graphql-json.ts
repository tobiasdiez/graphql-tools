import { buildClientSchema, ParseOptions } from 'graphql';
import { GraphQLSchemaValidationOptions } from 'graphql/type/schema';
import { Source } from './loaders';
import { SchemaPrintOptions } from './types';

function stripBOM(content: string): string {
  content = content.toString();
  // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
  // because the buffer-to-string conversion in `fs.readFileSync()`
  // translates it to FEFF, the UTF-16 BOM.
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  return content;
}

function parseBOM(content: string): any {
  return JSON.parse(stripBOM(content));
}

export function parseGraphQLJSON(
  location: string,
  jsonContent: string,
  options: SchemaPrintOptions & ParseOptions & GraphQLSchemaValidationOptions
): Source {
  let parsedJson = parseBOM(jsonContent);

  if (parsedJson.data) {
    parsedJson = parsedJson.data;
  }

  if (parsedJson.kind === 'Document') {
    return {
      location,
      document: parsedJson,
    };
  } else if (parsedJson.__schema) {
    const schema = buildClientSchema(parsedJson, options);

    return {
      location,
      schema,
    };
  } else if (typeof parsedJson === 'string') {
    return {
      location,
      rawSDL: parsedJson
    }
  }

  throw new Error(`Not valid JSON content`);
}
