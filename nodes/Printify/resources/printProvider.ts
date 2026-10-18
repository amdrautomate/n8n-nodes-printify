import type { INodeProperties } from 'n8n-workflow';
import { printProviderSelect } from '../shared/descriptions';
import { clientSideLimitProperties } from '../shared/routing';

const resource = ['printProvider'];

export const printProviderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a print provider',
				description: 'Get one print provider with its location',
				routing: {
					request: {
						method: 'GET',
						url: '=/v1/catalog/print_providers/{{$parameter.printProviderId}}.json',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many print providers',
				description: 'List every print provider in the Printify catalog',
				routing: { request: { method: 'GET', url: '/v1/catalog/print_providers.json' } },
			},
		],
		default: 'getAll',
	},
	{
		...printProviderSelect,
		displayOptions: { show: { resource, operation: ['get'] } },
	},
	...clientSideLimitProperties({ resource, operation: ['getAll'] }),
];
