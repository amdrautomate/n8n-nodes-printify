import type { INodeProperties } from 'n8n-workflow';
import { shopSelect, WEBHOOK_TOPICS, webhookSelect } from '../shared/descriptions';
import { deletedOutput } from '../shared/routing';

const resource = ['webhook'];
const shopBase = '=/v1/shops/{{$parameter.shopId}}/webhooks';
const webhookBase = `${shopBase}/{{$parameter.webhookId}}`;

export const webhookDescription: INodeProperties[] = [
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
				action: 'Create a webhook',
				description: 'Subscribe a URL to a Printify event',
				routing: { request: { method: 'POST', url: `${shopBase}.json` } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a webhook',
				description: 'Remove a webhook subscription',
				routing: {
					request: { method: 'DELETE', url: `${webhookBase}.json` },
					output: { postReceive: [deletedOutput] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many webhooks',
				description: 'List the webhooks of a shop',
				routing: { request: { method: 'GET', url: `${shopBase}.json` } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a webhook',
				description: 'Change the URL a webhook posts to',
				routing: { request: { method: 'PUT', url: `${webhookBase}.json` } },
			},
		],
		default: 'getAll',
	},
	{
		...shopSelect,
		displayOptions: { show: { resource } },
	},
	{
		...webhookSelect,
		displayOptions: { show: { resource, operation: ['delete', 'update'] } },
	},
	{
		displayName: 'Topic',
		name: 'topic',
		type: 'options',
		default: 'order:created',
		required: true,
		options: WEBHOOK_TOPICS,
		displayOptions: { show: { resource, operation: ['create'] } },
		description: 'The event that triggers the webhook',
		routing: { send: { type: 'body', property: 'topic' } },
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/webhooks/printify',
		displayOptions: { show: { resource, operation: ['create', 'update'] } },
		description: 'The HTTPS URL Printify posts the event to',
		routing: { send: { type: 'body', property: 'url' } },
	},
	{
		displayName: 'Secret',
		name: 'secret',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		displayOptions: { show: { resource, operation: ['create'] } },
		description:
			'Optional secret Printify uses to sign each delivery in the X-Pfy-Signature header (HMAC SHA-256)',
		routing: { send: { type: 'body', property: 'secret' } },
	},
];
