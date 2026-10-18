import type { INodeProperties } from 'n8n-workflow';

export const shopDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['shop'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many shops',
				description: 'List the shops connected to the Printify account',
				routing: {
					request: { method: 'GET', url: '/v1/shops.json' },
				},
			},
		],
		default: 'getAll',
	},
];
