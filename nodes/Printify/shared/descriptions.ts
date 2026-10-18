import type { INodeProperties } from 'n8n-workflow';

/** Shop picker, shared by every shop-scoped resource. */
export const shopSelect: INodeProperties = {
	displayName: 'Shop',
	name: 'shopId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The Printify shop to work in',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a shop...',
			typeOptions: {
				searchListMethod: 'getShops',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 8163654',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[0-9]+$',
						errorMessage: 'Shop IDs are numeric. Find yours under Printify > My Stores.',
					},
				},
			],
		},
	],
};

export const productSelect: INodeProperties = {
	displayName: 'Product',
	name: 'productId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The product to work with',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a product...',
			typeOptions: {
				searchListMethod: 'getProducts',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 5d39b159e7c48c000728c89f',
		},
	],
};

export const blueprintSelect: INodeProperties = {
	displayName: 'Blueprint',
	name: 'blueprintId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The catalog product type, for example a specific t-shirt or mug model',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a blueprint...',
			typeOptions: {
				searchListMethod: 'getBlueprints',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 384',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[0-9]+$',
						errorMessage: 'Blueprint IDs are numeric',
					},
				},
			],
		},
	],
};

export const printProviderSelect: INodeProperties = {
	displayName: 'Print Provider',
	name: 'printProviderId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The print provider that fulfills the blueprint',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a print provider...',
			typeOptions: {
				searchListMethod: 'getPrintProviders',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 1',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[0-9]+$',
						errorMessage: 'Print provider IDs are numeric',
					},
				},
			],
		},
	],
};

export const uploadSelect: INodeProperties = {
	displayName: 'Image',
	name: 'imageId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The uploaded image to work with',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select an image...',
			typeOptions: {
				searchListMethod: 'getUploads',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 5e16d66791287a0006e522b2',
		},
	],
};

export const webhookSelect: INodeProperties = {
	displayName: 'Webhook',
	name: 'webhookId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'The webhook to work with',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			placeholder: 'Select a webhook...',
			typeOptions: {
				searchListMethod: 'getWebhooks',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 5cb87a8cd490a2ccb256cec4',
		},
	],
};

export const simplifyToggle: INodeProperties = {
	displayName: 'Simplify',
	name: 'simplify',
	type: 'boolean',
	default: true,
	description: 'Whether to return a simplified version of the response instead of the raw data',
};

export const WEBHOOK_TOPICS = [
	{ name: 'Order Created', value: 'order:created' },
	{ name: 'Order Sent to Production', value: 'order:sent-to-production' },
	{ name: 'Order Shipment Created', value: 'order:shipment:created' },
	{ name: 'Order Shipment Delivered', value: 'order:shipment:delivered' },
	{ name: 'Order Updated', value: 'order:updated' },
	{ name: 'Personalization Preview Processed', value: 'personalization-preview-task:processed' },
	{ name: 'Product Created', value: 'product:created' },
	{ name: 'Product Deleted', value: 'product:deleted' },
	{ name: 'Product Publish Started', value: 'product:publish:started' },
	{ name: 'Product Updated', value: 'product:updated' },
	{ name: 'Shop Disconnected', value: 'shop:disconnected' },
];

export const ORDER_STATUSES = [
	'pending',
	'on-hold',
	'sending-to-production',
	'in-production',
	'canceled',
	'fulfilled',
	'partially-fulfilled',
	'payment-not-received',
	'has-issues',
	'cost-calculation',
	'unfulfillable',
].map((value) => ({
	name: value
		.split('-')
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(' '),
	value,
}));

export const SHIPPING_METHODS = [
	{ name: 'Standard', value: 1 },
	{ name: 'Priority', value: 2 },
	{ name: 'Express', value: 3 },
	{ name: 'Economy', value: 4 },
];

/** Address fields for Order > Create and Order > Calculate Shipping. */
export const addressFields: INodeProperties = {
	displayName: 'Shipping Address',
	name: 'addressTo',
	type: 'collection',
	placeholder: 'Add Address Field',
	default: {},
	required: true,
	description: 'Where the order ships. First name, last name, country, address line 1, city and ZIP are required by Printify.',
	options: [
		{ displayName: 'Address Line 1', name: 'address1', type: 'string', default: '', placeholder: 'e.g. 123 Main Street' },
		{ displayName: 'Address Line 2', name: 'address2', type: 'string', default: '', placeholder: 'e.g. Apt 4B' },
		{ displayName: 'City', name: 'city', type: 'string', default: '', placeholder: 'e.g. Austin' },
		{ displayName: 'Company', name: 'company', type: 'string', default: '' },
		{
			displayName: 'Country',
			name: 'country',
			type: 'string',
			default: '',
			placeholder: 'e.g. US',
			description: 'Two-letter ISO country code',
		},
		{ displayName: 'Email', name: 'email', type: 'string', default: '', placeholder: 'e.g. name@email.com' },
		{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', placeholder: 'e.g. Nathan' },
		{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', placeholder: 'e.g. Smith' },
		{ displayName: 'Phone', name: 'phone', type: 'string', default: '', placeholder: 'e.g. +1 512 555 0100' },
		{
			displayName: 'Region',
			name: 'region',
			type: 'string',
			default: '',
			placeholder: 'e.g. TX',
			description: 'State, province or region code',
		},
		{ displayName: 'ZIP / Postal Code', name: 'zip', type: 'string', default: '', placeholder: 'e.g. 78701' },
	],
};

/** Line items for Order > Create and Order > Calculate Shipping. */
export const lineItemFields: INodeProperties[] = [
	{
		displayName: 'Line Items Input',
		name: 'lineItemsMode',
		type: 'options',
		default: 'fields',
		options: [
			{ name: 'Fields', value: 'fields', description: 'Add each line item with the form below' },
			{ name: 'JSON', value: 'json', description: 'Pass the Printify line_items array as JSON' },
		],
	},
	{
		displayName: 'Line Items',
		name: 'lineItems',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		placeholder: 'Add Line Item',
		default: {},
		required: true,
		displayOptions: { show: { lineItemsMode: ['fields'] } },
		options: [
			{
				name: 'item',
				displayName: 'Item',
				values: [
					{
						displayName: 'External ID',
						name: 'externalId',
						type: 'string',
						default: '',
						description: 'Your own reference for this line, for example the order line ID in your store',
					},
					{
						displayName: 'Identify By',
						name: 'identifyBy',
						type: 'options',
						default: 'product',
						options: [
							{ name: 'Product and Variant ID', value: 'product' },
							{ name: 'SKU', value: 'sku' },
						],
					},
					{
						displayName: 'Product ID',
						name: 'productId',
						type: 'string',
						default: '',
						placeholder: 'e.g. 5d39b159e7c48c000728c89f',
						displayOptions: { show: { identifyBy: ['product'] } },
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						default: 1,
						typeOptions: { minValue: 1 },
					},
					{
						displayName: 'SKU',
						name: 'sku',
						type: 'string',
						default: '',
						placeholder: 'e.g. 6520286010',
						displayOptions: { show: { identifyBy: ['sku'] } },
					},
					{
						displayName: 'Variant ID',
						name: 'variantId',
						type: 'number',
						default: 0,
						placeholder: 'e.g. 17887',
						displayOptions: { show: { identifyBy: ['product'] } },
					},
				],
			},
		],
	},
	{
		displayName: 'Line Items (JSON)',
		name: 'lineItemsJson',
		type: 'json',
		default: '[\n  { "product_id": "", "variant_id": 0, "quantity": 1 }\n]',
		required: true,
		displayOptions: { show: { lineItemsMode: ['json'] } },
		description:
			'Printify line_items array. Each entry uses product_id + variant_id, sku, or blueprint_id + print_provider_id + variant_id + print_areas.',
	},
];
