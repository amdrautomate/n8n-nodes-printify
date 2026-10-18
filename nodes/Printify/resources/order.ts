import type { INodeProperties } from 'n8n-workflow';
import {
	addressFields,
	lineItemFields,
	ORDER_STATUSES,
	SHIPPING_METHODS,
	shopSelect,
	simplifyToggle,
} from '../shared/descriptions';
import { buildOrderBody, paginationProperties, simplifyOrder, unwrapData } from '../shared/routing';

const resource = ['order'];
const shopBase = '=/v1/shops/{{$parameter.shopId}}/orders';
const orderBase = `${shopBase}/{{$parameter.orderId}}`;

export const orderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Calculate Shipping',
				value: 'calculateShipping',
				action: 'Calculate shipping for an order',
				description: 'Get the shipping cost of a set of line items to an address, without placing an order',
				routing: {
					request: { method: 'POST', url: `${shopBase}/shipping.json` },
					send: { preSend: [buildOrderBody] },
				},
			},
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel an order',
				description: 'Cancel an order that has not been sent to production',
				routing: {
					request: { method: 'POST', url: `${orderBase}/cancel.json` },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an order',
				description: 'Submit an order for existing products to be fulfilled',
				routing: {
					request: { method: 'POST', url: `${shopBase}.json` },
					send: { preSend: [buildOrderBody] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an order',
				description: 'Get an order with its line items, address and shipments',
				routing: {
					request: { method: 'GET', url: `${orderBase}.json` },
					output: { postReceive: [simplifyOrder] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many orders',
				description: 'List the orders of a shop',
				routing: {
					request: { method: 'GET', url: `${shopBase}.json` },
					output: { postReceive: [unwrapData, simplifyOrder] },
				},
			},
			{
				name: 'Send to Production',
				value: 'sendToProduction',
				action: 'Send an order to production',
				description: 'Send an on-hold order to the print provider',
				routing: {
					request: { method: 'POST', url: `${orderBase}/send_to_production.json` },
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
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 5a96f649b2439217d070f507',
		displayOptions: { show: { resource, operation: ['cancel', 'get', 'sendToProduction'] } },
	},

	// ---- Create / Calculate Shipping ----
	...lineItemFields.map((field) => ({
		...field,
		displayOptions: {
			show: {
				resource,
				operation: ['create', 'calculateShipping'],
				...(field.displayOptions?.show ?? {}),
			},
		},
	})),
	{
		...addressFields,
		displayOptions: { show: { resource, operation: ['create', 'calculateShipping'] } },
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
				displayName: 'Economy Shipping',
				name: 'isEconomyShipping',
				type: 'boolean',
				default: false,
				description: 'Whether to ship with the economy service where the products allow it',
				routing: { send: { type: 'body', property: 'is_economy_shipping' } },
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Your own order reference, for example the order number in your store',
				routing: { send: { type: 'body', property: 'external_id' } },
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				description: 'A label shown on the order in Printify',
				routing: { send: { type: 'body', property: 'label' } },
			},
			{
				displayName: 'Printify Express',
				name: 'isPrintifyExpress',
				type: 'boolean',
				default: false,
				description: 'Whether to fulfill with Printify Express where the products are eligible',
				routing: { send: { type: 'body', property: 'is_printify_express' } },
			},
			{
				displayName: 'Send Shipping Notification',
				name: 'sendShippingNotification',
				type: 'boolean',
				default: false,
				description: 'Whether Printify should email the customer when the order ships',
				routing: { send: { type: 'body', property: 'send_shipping_notification' } },
			},
			{
				displayName: 'Shipping Method',
				name: 'shippingMethod',
				type: 'options',
				default: 1,
				options: SHIPPING_METHODS,
				routing: { send: { type: 'body', property: 'shipping_method' } },
			},
		],
	},

	// ---- Get Many ----
	...paginationProperties({ resource, operation: ['getAll'] }, 10),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: { resource, operation: ['getAll'] } },
		options: [
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				description: 'Only orders that contain at least one product with this SKU',
				routing: { send: { type: 'query', property: 'sku' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				default: 'pending',
				options: ORDER_STATUSES,
				routing: { send: { type: 'query', property: 'status' } },
			},
		],
	},
	{
		...simplifyToggle,
		displayOptions: { show: { resource, operation: ['get', 'getAll'] } },
	},
];
