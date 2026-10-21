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
	// so the rule fails the test whenever no workspace id comes back.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.domain}}',
			url: '/metadata',
			method: 'POST',
			body: {
				query: 'query CredentialTest { currentWorkspace { id } }',
			},
			json: true,
		},
		rules: [
			{
				type: 'responseSuccessBody',
				properties: {
					key: 'data.currentWorkspace.id',
					value: undefined,
					message: 'Twenty did not accept the API key (no workspace returned). Check the API key and domain.',
				},
			},
		],
	};
}
