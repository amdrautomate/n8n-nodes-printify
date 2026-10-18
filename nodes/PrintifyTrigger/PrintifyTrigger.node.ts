import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';
import { getShops } from '../Printify/listSearch';
import { shopSelect, WEBHOOK_TOPICS } from '../Printify/shared/descriptions';
import { printifyApiRequest } from '../Printify/shared/transport';

type PrintifyWebhook = { id: string; topic: string; url: string; shop_id?: number };

type TriggerStaticData = {
	webhookIds?: string[];
	secret?: string;
};

function staticData(this: IHookFunctions | IWebhookFunctions): TriggerStaticData {
	return this.getWorkflowStaticData('node') as TriggerStaticData;
}

function shopId(this: IHookFunctions | IWebhookFunctions): string {
	return String(this.getNodeParameter('shopId', '', { extractValue: true }));
}

export class PrintifyTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Printify Trigger',
		name: 'printifyTrigger',
		icon: { light: 'file:../../icons/printify.svg', dark: 'file:../../icons/printify.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{ $parameter["events"].join(", ") }}',
		description: 'Starts the workflow when an order or product changes in Printify',
		defaults: {
			name: 'Printify Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'printifyApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			shopSelect,
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: ['order:created'],
				options: WEBHOOK_TOPICS,
				description: 'The Printify events that start this workflow',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Verify Signature',
						name: 'verifySignature',
						type: 'boolean',
						default: true,
						description:
							'Whether to reject deliveries whose X-Pfy-Signature header does not match the secret registered with Printify',
					},
				],
			},
		],
	};

	methods = {
		listSearch: {
			getShops,
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events', []) as string[];
				const existing = (await printifyApiRequest.call(
					this,
					'GET',
					`/v1/shops/${shopId.call(this)}/webhooks.json`,
				)) as PrintifyWebhook[];

				const ours = existing.filter((w) => w.url === webhookUrl);
				const registeredTopics = new Set(ours.map((w) => w.topic));
				const complete = events.every((topic) => registeredTopics.has(topic));
				if (!complete) return false;

				const data = staticData.call(this);
				data.webhookIds = ours.map((w) => w.id);
				return true;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const events = this.getNodeParameter('events', []) as string[];
				if (events.length === 0) {
					throw new NodeOperationError(this.getNode(), "Select at least one event under 'Events'");
				}

				const data = staticData.call(this);
				const secret = randomBytes(20).toString('hex');
				const ids: string[] = [];

				for (const topic of events) {
					const created = (await printifyApiRequest.call(
						this,
						'POST',
						`/v1/shops/${shopId.call(this)}/webhooks.json`,
						{},
						{ topic, url: webhookUrl, secret },
					)) as PrintifyWebhook;
					ids.push(created.id);
				}

				data.webhookIds = ids;
				data.secret = secret;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const data = staticData.call(this);
				const ids = data.webhookIds ?? [];
				for (const id of ids) {
					try {
						await printifyApiRequest.call(
							this,
							'DELETE',
							`/v1/shops/${shopId.call(this)}/webhooks/${id}.json`,
						);
					} catch (error) {
						// Usually already removed in Printify; log so a real failure is visible.
						this.logger.warn(
							`Printify Trigger: could not delete webhook ${id}: ${(error as Error).message}`,
						);
					}
				}
				delete data.webhookIds;
				delete data.secret;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const options = this.getNodeParameter('options', {}) as { verifySignature?: boolean };
		const verify = options.verifySignature ?? true;
		const body = this.getBodyData() as IDataObject;

		if (verify) {
			const data = staticData.call(this);
			const req = this.getRequestObject();
			const header = String(this.getHeaderData()['x-pfy-signature'] ?? '');
			const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(body));

			if (!data.secret || !header.startsWith('sha256=')) {
				return rejected(this, 'Missing signature');
			}
			const expected = createHmac('sha256', data.secret).update(rawBody).digest('hex');
			const received = header.slice('sha256='.length);
			const valid =
				expected.length === received.length &&
				timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(received, 'utf8'));
			if (!valid) {
				return rejected(this, 'Invalid signature');
			}
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}

function rejected(context: IWebhookFunctions, reason: string): IWebhookResponseData {
	const res = context.getResponseObject();
	res.status(401).json({ message: reason });
	return { noWebhookResponse: true };
}
