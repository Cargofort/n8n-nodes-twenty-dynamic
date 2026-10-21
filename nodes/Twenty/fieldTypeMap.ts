/**
 * Twenty field type mapping
 *
 * Maps every Twenty field type to the n8n input category used by the node's
 * Fields collection (see the hidden `fieldType` parameter in Twenty.node.ts).
 *
 * Source of truth: the FieldMetadataType enum in
 * packages/twenty-shared/src/types/FieldMetadataType.ts (twentyhq/twenty).
 * Every enum value has an explicit entry so nothing silently falls through to
 * the default. Verified against the Twenty v2.49.0 enum (25 values).
 *
 * The map also contains the GraphQL introspection composite type names
 * (PascalCase), which the data schema reports instead of the enum values.
 *
 * Categories with dedicated inputs: fullName, link, currency, address, emails,
 * phones, select, multiSelect, boolean, simple. The category 'relation'
 * renders no value input and writes nothing; it is used for composite or
 * read-only types that cannot be written with a plain value.
 *
 * Ported from xangelix/n8n-nodes-twenty-crm-next (fieldTypeMap.ts).
 */
export const TWENTY_TYPE_TO_N8N_TYPE: Record<string, string> = {
	// ---- FieldMetadataType enum values (metadata API, SCREAMING_CASE) ----
	ACTOR: 'relation', // Composite {source, name, ...}, system-managed
	ADDRESS: 'address',
	ARRAY: 'simple',
	BOOLEAN: 'boolean',
	CURRENCY: 'currency',
	DATE: 'simple',
	DATE_TIME: 'simple',
	EMAILS: 'emails',
	FILES: 'relation', // Composite file reference, not writable via plain value
	FULL_NAME: 'fullName',
	LINKS: 'link',
	MORPH_RELATION: 'relation', // Polymorphic relation, not writable via plain value
	MULTI_SELECT: 'multiSelect',
	NUMBER: 'simple',
	NUMERIC: 'simple',
	PHONES: 'phones',
	POSITION: 'simple',
	RATING: 'simple',
	RAW_JSON: 'simple',
	RELATION: 'relation',
	RICH_TEXT: 'simple',
	SELECT: 'select',
	TEXT: 'simple',
	TS_VECTOR: 'relation', // Read-only search vector
	UUID: 'simple',

	// ---- GraphQL introspection composite type names (data schema) ----
	FullName: 'fullName',
	Links: 'link',
	Currency: 'currency',
	Address: 'address',
	Emails: 'emails',
	Phones: 'phones',
	Actor: 'relation',
};

/**
 * Map a Twenty field type (metadata enum value or GraphQL type name) to the
 * n8n input category. Unknown types fall back to 'simple'.
 *
 * @param {string} twentyType The Twenty field type.
 * @returns {string} The n8n input category.
 */
export function mapTwentyTypeToN8nType(twentyType: string): string {
	return TWENTY_TYPE_TO_N8N_TYPE[twentyType] || 'simple';
}
