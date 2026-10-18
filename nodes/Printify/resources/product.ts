import type { INodeProperties } from 'n8n-workflow';
import {
	blueprintSelect,
	printProviderSelect,
	productSelect,
	shopSelect,
	simplifyToggle,
} from '../shared/descriptions';
import {
	buildProductCreateBody,
	buildProductUpdateBody,
	buildPublishBody,
	deletedOutput,
	paginationProperties,
	simplifyProduct,
	successOutput,
	unwrapData,
} from '../shared/routing';

const resource = ['product'];
const shopBase = '=/v1/shops/{{$parameter.shopId}}/products';
const productBase = `${shopBase}/{{$parameter.productId}}`;

export const productDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a product',
				description: 'Create a product from a blueprint, print provider, variants and print areas',
				routing: {
					request: { method: 'POST', url: `${shopBase}.json` },
					send: { preSend: [buildProductCreateBody] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a product',
				description: 'Delete a product from the shop',
				routing: {
					request: { method: 'DELETE', url: `${productBase}.json` },
					output: { postReceive: [deletedOutput] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product',
				description: 'Get a product with its variants, images and print areas',
				routing: {
					request: { method: 'GET', url: `${productBase}.json` },
					output: { postReceive: [simplifyProduct] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many products',
				description: 'List the products in a shop',
				routing: {
					request: { method: 'GET', url: `${shopBase}.json` },
					output: { postReceive: [unwrapData, simplifyProduct] },
				},
			},
			{
				name: 'Mark Publish Failed',
				value: 'publishFailed',
				action: 'Mark a product publish as failed',
				description: 'Tell Printify that publishing to your sales channel failed, which unlocks the product',
				routing: {
					request: { method: 'POST', url: `${productBase}/publishing_failed.json` },
					output: { postReceive: [successOutput] },
				},
			},
			{
				name: 'Mark Publish Succeeded',
				value: 'publishSucceeded',
				action: 'Mark a product publish as succeeded',
				description: 'Tell Printify the product is live in your sales channel and store its external ID',
				routing: {
					request: { method: 'POST', url: `${productBase}/publishing_succeeded.json` },
					output: { postReceive: [successOutput] },
				},
			},
			{
				name: 'Publish',
				value: 'publish',
				action: 'Publish a product',
				description: 'Start publishing a product to the connected sales channel',
				routing: {
					request: { method: 'POST', url: `${productBase}/publish.json` },
					send: { preSend: [buildPublishBody] },
					output: { postReceive: [successOutput] },
				},
			},
			{
				name: 'Unpublish',
				value: 'unpublish',
				action: 'Unpublish a product',
				description: 'Tell Printify the product was removed from the sales channel',
				routing: {
					request: { method: 'POST', url: `${productBase}/unpublish.json` },
					output: { postReceive: [successOutput] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a product',
				description: 'Update the title, description, tags, variants or print areas of a product',
				routing: {
					request: { method: 'PUT', url: `${productBase}.json` },
					send: { preSend: [buildProductUpdateBody] },
				},
			},
		],
		default: 'getAll',
	},
	{
		...shopSelect,
		displayOptions: { show: { resource } },
	},
	{
		...productSelect,
		displayOptions: {
			show: {
				resource,
				operation: [
					'delete',
					'get',
					'publish',
					'publishFailed',
					'publishSucceeded',
					'unpublish',
					'update',
				],
			},
		},
	},

	// ---- Create ----
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. Sunrise Logo Tee',
		displayOptions: { show: { resource, operation: ['create'] } },
	},
	{
		...blueprintSelect,
		displayOptions: { show: { resource, operation: ['create'] } },
	},
	{
		...printProviderSelect,
		displayOptions: { show: { resource, operation: ['create'] } },
	},
	{
		displayName: 'Variants',
		name: 'variants',
		type: 'json',
		default: '[\n  { "id": 45740, "price": 1999, "is_enabled": true }\n]',
		required: true,
		displayOptions: { show: { resource, operation: ['create'] } },
		description:
			'Array of variants to sell. Get the IDs from Blueprint > Get Variants. Prices are in cents.',
	},
	{
		displayName: 'Print Areas',
		name: 'printAreas',
		type: 'json',
		default:
			'[\n  {\n    "variant_ids": [45740],\n    "placeholders": [\n      { "position": "front", "images": [ { "id": "", "x": 0.5, "y": 0.5, "scale": 1, "angle": 0 } ] }\n    ]\n  }\n]',
		required: true,
		displayOptions: { show: { resource, operation: ['create'] } },
		description:
			'Array of print areas. Each placeholder position holds images uploaded through Upload > Upload (use the returned image ID).',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['create'] } },
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
			},
			{
				displayName: 'Safety Information',
				name: 'safetyInformation',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'GPSR safety text shown to EU customers',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: 'e.g. summer, logo, cotton',
				description: 'Comma-separated list of tags',
			},
		],
	},

	// ---- Update ----
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['update'] } },
		options: [
			{
				displayName: 'Blueprint ID',
				name: 'blueprintId',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 4 },
				default: '',
			},
			{
				displayName: 'Print Areas',
				name: 'printAreas',
				type: 'json',
				default: '[]',
				description: 'Full print_areas array to replace the current one',
			},
			{
				displayName: 'Print Provider ID',
				name: 'printProviderId',
				type: 'number',
				default: 0,
			},
			{
				displayName: 'Safety Information',
				name: 'safetyInformation',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '',
				placeholder: 'e.g. summer, logo, cotton',
				description: 'Comma-separated list of tags, replaces the current tags',
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Variants',
				name: 'variants',
				type: 'json',
				default: '[]',
				description: 'Full variants array to replace the current one',
			},
		],
	},

	// ---- Publish ----
	{
		displayName: 'Fields to Publish',
		name: 'publishFields',
		type: 'multiOptions',
		default: ['title', 'description', 'images', 'variants', 'tags', 'keyFeatures', 'shipping_template'],
		displayOptions: { show: { resource, operation: ['publish'] } },
		description: 'Which parts of the product to push to the sales channel',
		options: [
			{ name: 'Description', value: 'description' },
			{ name: 'Images', value: 'images' },
			{ name: 'Key Features', value: 'keyFeatures' },
			{ name: 'Shipping Template', value: 'shipping_template' },
			{ name: 'Tags', value: 'tags' },
			{ name: 'Title', value: 'title' },
			{ name: 'Variants', value: 'variants' },
		],
	},

	// ---- Mark Publish Succeeded ----
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 5941187272705',
		displayOptions: { show: { resource, operation: ['publishSucceeded'] } },
		description: 'The ID of the product in your sales channel',
		routing: { send: { type: 'body', property: 'external.id' } },
	},
	{
		displayName: 'External Handle',
		name: 'externalHandle',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/products/sunrise-logo-tee',
		displayOptions: { show: { resource, operation: ['publishSucceeded'] } },
		description: 'The public URL or handle of the product in your sales channel',
		routing: { send: { type: 'body', property: 'external.handle' } },
	},

	// ---- Mark Publish Failed ----
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. Request timed out',
		displayOptions: { show: { resource, operation: ['publishFailed'] } },
		routing: { send: { type: 'body', property: 'reason' } },
	},

	// ---- Get Many ----
	...paginationProperties({ resource, operation: ['getAll'] }, 50),
	{
		...simplifyToggle,
		displayOptions: { show: { resource, operation: ['get', 'getAll'] } },
	},
];
