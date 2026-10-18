import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PrintifyApi implements ICredentialType {
	name = 'printifyApi';

	displayName = 'Printify API';

	icon: Icon = { light: 'file:../icons/printify.svg', dark: 'file:../icons/printify.dark.svg' };

	documentationUrl = 'https://github.com/Empower21/n8n-nodes-printify#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'Personal Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Generate one in Printify under My Profile > Connections. Tokens are shown once and stay valid for one year.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
				'User-Agent': 'n8n-nodes-printify',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.printify.com',
			url: '/v1/shops.json',
			method: 'GET',
			headers: {
				'User-Agent': 'n8n-nodes-printify',
			},
		},
	};
}
