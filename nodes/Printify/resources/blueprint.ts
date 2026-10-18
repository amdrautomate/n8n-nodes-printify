import type { INodeProperties } from 'n8n-workflow';
import { blueprintSelect, printProviderSelect } from '../shared/descriptions';
import { clientSideLimitProperties } from '../shared/routing';

const resource = ['blueprint'];
const base = '=/v1/catalog/blueprints/{{$parameter.blueprintId}}';

export const blueprintDescription: INodeProperties[] = [
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
				action: 'Get a blueprint',
				description: 'Get one catalog blueprint with its images and print providers',
				routing: { request: { method: 'GET', url: `${base}.json` } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many blueprints',
				description: 'List every blueprint in the Printify catalog',
				routing: { request: { method: 'GET', url: '/v1/catalog/blueprints.json' } },
			},
			{
				name: 'Get Print Providers',
				value: 'getPrintProviders',
				action: 'Get print providers for a blueprint',
				description: 'List the print providers that fulfill a blueprint',
				routing: { request: { method: 'GET', url: `${base}/print_providers.json` } },
			},
			{
				name: 'Get Shipping',
				value: 'getShipping',
				action: 'Get shipping for a blueprint',
				description: 'Get handling times and shipping costs for a blueprint at a print provider',
				routing: {
					request: {
						method: 'GET',
						url: `${base}/print_providers/{{$parameter.printProviderId}}/shipping.json`,
					},
				},
			},
			{
				name: 'Get Size Guide',
				value: 'getSizeGuide',
				action: 'Get the size guide of a blueprint',
				description: 'Get the size guide for a blueprint',
				routing: { request: { method: 'GET', url: `${base}/size_guide.json` } },
			},
			{
				name: 'Get Variants',
				value: 'getVariants',
				action: 'Get variants of a blueprint',
				description: 'List the variants (sizes, colors, placeholders) a print provider offers for a blueprint',
				routing: {
					request: {
						method: 'GET',
						url: `${base}/print_providers/{{$parameter.printProviderId}}/variants.json`,
					},
					output: {
						postReceive: [{ type: 'rootProperty', properties: { property: 'variants' } }],
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		...blueprintSelect,
		displayOptions: {
			show: {
				resource,
				operation: ['get', 'getPrintProviders', 'getShipping', 'getSizeGuide', 'getVariants'],
			},
		},
	},
	{
		...printProviderSelect,
		displayOptions: { show: { resource, operation: ['getShipping', 'getVariants'] } },
	},
	{
		displayName: 'Show Out of Stock',
		name: 'showOutOfStock',
		type: 'boolean',
		default: false,
		description: 'Whether to include variants that are currently out of stock',
		displayOptions: { show: { resource, operation: ['getVariants'] } },
		routing: {
			send: {
				type: 'query',
				property: 'show-out-of-stock',
				value: '={{ $value ? 1 : 0 }}',
			},
		},
	},
	...clientSideLimitProperties({ resource, operation: ['getAll'] }),
];
