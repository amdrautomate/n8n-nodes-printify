import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { blueprintDescription } from './resources/blueprint';
import { orderDescription } from './resources/order';
import { printProviderDescription } from './resources/printProvider';
import { productDescription } from './resources/product';
import { shopDescription } from './resources/shop';
import { uploadDescription } from './resources/upload';
import { webhookDescription } from './resources/webhook';
import {
	getBlueprints,
	getPrintProviders,
	getProducts,
	getShops,
	getUploads,
	getWebhooks,
} from './listSearch';
import { PRINTIFY_BASE_URL, USER_AGENT } from './shared/transport';

export class Printify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Printify',
		name: 'printify',
		icon: { light: 'file:../../icons/printify.svg', dark: 'file:../../icons/printify.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Manage print-on-demand products, orders, uploads and webhooks in Printify',
		defaults: {
			name: 'Printify',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'printifyApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: PRINTIFY_BASE_URL,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json;charset=utf-8',
				'User-Agent': USER_AGENT,
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Blueprint', value: 'blueprint' },
					{ name: 'Order', value: 'order' },
					{ name: 'Print Provider', value: 'printProvider' },
					{ name: 'Product', value: 'product' },
					{ name: 'Shop', value: 'shop' },
					{ name: 'Upload', value: 'upload' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'product',
			},
			...blueprintDescription,
			...orderDescription,
			...printProviderDescription,
			...productDescription,
			...shopDescription,
			...uploadDescription,
			...webhookDescription,
		],
	};

	methods = {
		listSearch: {
			getBlueprints,
			getPrintProviders,
			getProducts,
			getShops,
			getUploads,
			getWebhooks,
		},
	};
}
