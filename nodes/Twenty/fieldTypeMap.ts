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

/**
 * Filterable sub-fields of composite types, used by the Upsert "Match Field"
 * dropdowns. Twenty's REST filter matches composite sub-field paths
 * (e.g. `emails.primaryEmail[eq]:"..."`) and rejects a filter on the whole
 * composite object. Keys are n8n input categories from TWENTY_TYPE_TO_N8N_TYPE.
 *
 * Sub-field names verified against the Twenty v2.49.0 composite type
 * definitions in packages/twenty-shared/src/types/composite-types/*.ts.
 * Ported from xangelix/n8n-nodes-twenty-crm-next (2.1.5).
 */
export const COMPOUND_MATCH_SUB_FIELDS: Record<string, Array<{ subField: string; label: string }>> = {
	emails: [{ subField: 'primaryEmail', label: 'Primary Email' }],
	phones: [{ subField: 'primaryPhoneNumber', label: 'Primary Phone Number' }],
	link: [{ subField: 'primaryLinkUrl', label: 'Link URL' }],
	fullName: [
		{ subField: 'firstName', label: 'First Name' },
		{ subField: 'lastName', label: 'Last Name' },
	],
	currency: [
		{ subField: 'amountMicros', label: 'Amount (Micros)' },
		{ subField: 'currencyCode', label: 'Currency Code' },
	],
	address: [
		{ subField: 'addressStreet1', label: 'Street 1' },
		{ subField: 'addressStreet2', label: 'Street 2' },
		{ subField: 'addressCity', label: 'City' },
		{ subField: 'addressPostcode', label: 'Postcode' },
		{ subField: 'addressState', label: 'State' },
		{ subField: 'addressCountry', label: 'Country' },
	],
};

/**
 * Field types that cannot be used as an upsert match field with an `eq`
 * filter (JSON, arrays, rich text). Relations are excluded via their
 * 'relation' category.
 */
export const NON_MATCHABLE_FIELD_TYPES = new Set<string>([
	'RAW_JSON',
	'ARRAY',
	'RICH_TEXT',
	'RichText',
	'RichTextV2',
]);

/**
 * Resolves the stored upsert match-field parameter to a REST filter path.
 *
 * New values are either `<field>|<category>` (scalar) or `<field>.<subField>`
 * (composite sub-field). Values saved by older versions may name a composite
 * parent (e.g. `emails|emails`), which Twenty rejects as a filter; those are
 * mapped to the composite's only filterable sub-field (emails, phones, links),
 * and rejected with a clear message when the composite has several.
 *
 * @param {string} matchFieldParam The stored parameter value.
 * @param {Array<{ name: string; type: string }>} objectFields Fields of the object (metadata).
 * @returns {{ path: string } | { error: string }} The filter path, or an error message.
 */
export function resolveMatchFieldPath(
	matchFieldParam: string,
	objectFields: Array<{ name: string; type: string }>,
): { path: string } | { error: string } {
	const [fieldName, storedCategory] = String(matchFieldParam).split('|');
	if (fieldName.includes('.')) {
		return { path: fieldName };
	}

	const metadataType = objectFields.find((field) => field.name === fieldName)?.type;
	const category = metadataType ? mapTwentyTypeToN8nType(metadataType) : storedCategory;
	const subFields = category ? COMPOUND_MATCH_SUB_FIELDS[category] : undefined;
	if (!subFields) {
		return { path: fieldName };
	}
	if (subFields.length === 1) {
		return { path: `${fieldName}.${subFields[0].subField}` };
	}
	const choices = subFields.map(({ subField }) => `${fieldName}.${subField}`).join(', ');
	return {
		error: `Match field "${fieldName}" is a composite field and cannot be matched as a whole. Re-select the match field and pick one of: ${choices}`,
	};
}
