import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TwentyApi implements ICredentialType {
	name = 'twentyApi';
	displayName = 'Twenty API';
	properties: INodeProperties[] = [
		{
			displayName: 'API key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
		},
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Schema Cache',
			name: 'schemaCache',
			type: 'hidden',
			default: '',
			description: 'Stores the API schema to reduce API calls. Will be updated automatically.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},
	};

	// /open-api/core is a public endpoint that answers 200 for any (or no) API key,
	// so it cannot validate credentials. Query the authenticated metadata API instead:
	// Twenty answers GraphQL auth failures with HTTP 200 and an `errors` array (no data),
	// so the rule fails the test whenever no objects connection comes back.
	// `objects` is used (not `currentWorkspace`) because it has been served by /metadata
	// in every Twenty version; before v1.18 `currentWorkspace` lived on /graphql only.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.domain}}',
			url: '/metadata',
			method: 'POST',
			body: {
				query: 'query CredentialTest { objects(paging: { first: 1 }) { edges { node { id } } } }',
			},
			json: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'data.objects.edges',
					value: undefined,
					message: 'Twenty did not accept the API key (no metadata returned). Check the API key and domain.',
				},
			},
		],
	};
}
