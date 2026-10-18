import {
	NodeApiError,
	NodeOperationError,
	type IDataObject,
	type IExecuteSingleFunctions,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INodeExecutionData,
	type INodeProperties,
	type INodePropertyOptions,
	type JsonObject,
	type PostReceiveAction,
} from 'n8n-workflow';
import { printifyApiRequest } from './transport';

/**
 * Printify answers errors as { message: "Operation failed.", errors: { reason: "..." } }.
 * n8n's default handling would show only "Bad request", so every operation runs this first
 * (the node sets `ignoreHttpStatusErrors` and raises here with Printify's own reason).
 */
export async function raisePrintifyError(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
	response: IN8nHttpFullResponse,
): Promise<INodeExecutionData[]> {
	const status = response.statusCode ?? 200;
	if (status < 400) {
		// With a postReceive chain present, n8n hands over the body as one item. Mirror its
		// default behaviour and split array responses (shops, providers, webhooks) into items.
		return Array.isArray(response.body)
			? (response.body as IDataObject[]).map((json) => ({ json }))
			: items;
	}

	const body = (typeof response.body === 'object' && response.body !== null
		? response.body
		: { message: String(response.body ?? '') }) as IDataObject;
	const errors = (body.errors as IDataObject | undefined) ?? {};
	const reason = (errors.reason as string | undefined) ?? (body.error as string | undefined);
	const message = (body.message as string | undefined) ?? '';

	const summary: Record<number, string> = {
		401: 'Printify rejected the token. Check the Printify API credential',
		403: 'The token is missing the scope this operation needs',
		404: 'Printify could not find that resource. Check the IDs and the selected shop',
		429: 'Printify rate limit reached (600 requests per minute, 100 for catalog). Try again shortly',
	};

	throw new NodeApiError(this.getNode(), body as JsonObject, {
		httpCode: String(status),
		message: reason ?? summary[status] ?? (message || `Printify returned status ${status}`),
		description: reason ? message || summary[status] : undefined,
	});
}

/** Prepends the Printify error check to every operation's postReceive chain. */
export function withPrintifyErrors(properties: INodeProperties[]): INodeProperties[] {
	for (const property of properties) {
		if (property.name !== 'operation' || !Array.isArray(property.options)) continue;
		for (const option of property.options as INodePropertyOptions[]) {
			if (!option.routing) continue;
			option.routing.output = option.routing.output ?? {};
			option.routing.output.postReceive = [
				raisePrintifyError,
				...(option.routing.output.postReceive ?? []),
			];
		}
	}
	return properties;
}

/**
 * Printify lists are page based: { data: [...], current_page, last_page, ... }.
 * This pagination asks for the next page until the last one, and n8n stops early
 * once `maxResults` (the Limit parameter) is reached.
 */
export const pagePagination = {
	pagination: {
		type: 'generic' as const,
		properties: {
			continue: '={{ $response.body.current_page < $response.body.last_page }}',
			request: {
				qs: {
					page: '={{ $response.body.current_page + 1 }}',
				},
			},
		},
	},
};

/** Unwraps the `data` array of a paginated Printify response. */
export const unwrapData: PostReceiveAction = {
	type: 'rootProperty',
	properties: { property: 'data' },
};

/** Replaces an empty delete response with the n8n convention `{ deleted: true }`. */
export const deletedOutput: PostReceiveAction = {
	type: 'set',
	properties: { value: '={{ { "deleted": true } }}' },
};

/** Replaces an empty 200 response with `{ success: true }`. */
export const successOutput: PostReceiveAction = {
	type: 'set',
	properties: { value: '={{ { "success": true } }}' },
};

/**
 * "Return All" + "Limit" pair for a paginated Get Many operation.
 * `apiMax` is the largest page size Printify accepts on that endpoint.
 */
export function paginationProperties(
	show: { resource: string[]; operation: string[] },
	apiMax: number,
): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
			routing: {
				send: {
					paginate: '={{ $value }}',
					type: 'query',
					property: 'limit',
					value: String(apiMax),
				},
				operations: pagePagination,
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				send: {
					paginate: true,
					type: 'query',
					property: 'limit',
					value: `={{ Math.min($value, ${apiMax}) }}`,
				},
				output: { maxResults: '={{ $value }}' },
				operations: pagePagination,
			},
		},
	];
}

/** "Return All" + "Limit" pair for endpoints that return one big array with no paging. */
export function clientSideLimitProperties(show: {
	resource: string[];
	operation: string[];
}): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				output: { maxResults: '={{ $value }}' },
			},
		},
	];
}

/** Parses a JSON parameter that may arrive as a string or as an already-parsed value. */
function parseJson(
	context: IExecuteSingleFunctions,
	value: unknown,
	displayName: string,
): IDataObject | IDataObject[] | undefined {
	if (typeof value !== 'string') return value as IDataObject | IDataObject[] | undefined;
	const trimmed = value.trim();
	if (trimmed === '') return undefined;
	try {
		return JSON.parse(trimmed) as IDataObject | IDataObject[];
	} catch {
		throw new NodeOperationError(
			context.getNode(),
			`'${displayName}' must be valid JSON`,
			{ description: 'Check for missing quotes, unquoted keys or trailing commas' },
		);
	}
}

function toNumber(value: unknown): number | undefined {
	if (value === undefined || value === null || value === '') return undefined;
	const n = Number(value);
	return Number.isNaN(n) ? undefined : n;
}

function splitTags(value: unknown): string[] | undefined {
	if (value === undefined || value === null) return undefined;
	if (Array.isArray(value)) return value.map(String);
	return String(value)
		.split(',')
		.map((t) => t.trim())
		.filter(Boolean);
}

const ADDRESS_FIELDS: Array<[string, string]> = [
	['firstName', 'first_name'],
	['lastName', 'last_name'],
	['email', 'email'],
	['phone', 'phone'],
	['country', 'country'],
	['region', 'region'],
	['address1', 'address1'],
	['address2', 'address2'],
	['city', 'city'],
	['zip', 'zip'],
	['company', 'company'],
];

type LineItemInput = {
	identifyBy?: 'product' | 'sku';
	productId?: string;
	variantId?: number;
	sku?: string;
	quantity?: number;
	externalId?: string;
};

function buildLineItems(this: IExecuteSingleFunctions): IDataObject[] {
	const mode = this.getNodeParameter('lineItemsMode', 'fields') as string;
	if (mode === 'json') {
		const parsed = parseJson(this, this.getNodeParameter('lineItemsJson', '[]'), 'Line Items (JSON)');
		if (!Array.isArray(parsed) || parsed.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				"'Line Items (JSON)' must be a non-empty array of line items",
			);
		}
		return parsed as IDataObject[];
	}

	const collection = this.getNodeParameter('lineItems', {}) as { item?: LineItemInput[] };
	const items = collection.item ?? [];
	if (items.length === 0) {
		throw new NodeOperationError(this.getNode(), "Add at least one entry under 'Line Items'");
	}

	return items.map((item, index) => {
		const line: IDataObject = { quantity: item.quantity ?? 1 };
		if (item.identifyBy === 'sku') {
			if (!item.sku) {
				throw new NodeOperationError(
					this.getNode(),
					`'SKU' is required for line item ${index + 1}`,
				);
			}
			line.sku = item.sku;
		} else {
			if (!item.productId || !item.variantId) {
				throw new NodeOperationError(
					this.getNode(),
					`'Product ID' and 'Variant ID' are required for line item ${index + 1}`,
				);
			}
			line.product_id = item.productId;
			line.variant_id = item.variantId;
		}
		if (item.externalId) line.external_id = item.externalId;
		return line;
	});
}

function buildAddress(this: IExecuteSingleFunctions): IDataObject {
	const address = this.getNodeParameter('addressTo', {}) as IDataObject;
	const out: IDataObject = {};
	for (const [param, apiField] of ADDRESS_FIELDS) {
		const value = address[param];
		if (value !== undefined && value !== '') out[apiField] = value;
	}
	const missing = ['first_name', 'last_name', 'country', 'address1', 'city', 'zip'].filter(
		(key) => !out[key],
	);
	if (missing.length > 0) {
		throw new NodeOperationError(
			this.getNode(),
			`'Shipping Address' is missing ${missing.join(', ').replace(/_/g, ' ')}`,
			{ description: 'Printify needs these fields before it will accept the order' },
		);
	}
	return out;
}

/** preSend for Order > Create and Order > Calculate Shipping. */
export async function buildOrderBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = {
		...((requestOptions.body as IDataObject) ?? {}),
		line_items: buildLineItems.call(this),
		address_to: buildAddress.call(this),
	};
	return requestOptions;
}

/** preSend for Product > Create. */
export async function buildProductCreateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const additional = this.getNodeParameter('additionalFields', {}) as IDataObject;
	const body: IDataObject = {
		title: this.getNodeParameter('title', '') as string,
		blueprint_id: toNumber(this.getNodeParameter('blueprintId', '', { extractValue: true })),
		print_provider_id: toNumber(
			this.getNodeParameter('printProviderId', '', { extractValue: true }),
		),
		variants: parseJson(this, this.getNodeParameter('variants', ''), 'Variants'),
		print_areas: parseJson(this, this.getNodeParameter('printAreas', ''), 'Print Areas'),
	};
	if (additional.description !== undefined) body.description = additional.description;
	if (additional.safetyInformation !== undefined) {
		body.safety_information = additional.safetyInformation;
	}
	const tags = splitTags(additional.tags);
	if (tags?.length) body.tags = tags;

	requestOptions.body = body;
	return requestOptions;
}

/** preSend for Product > Update. */
export async function buildProductUpdateBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const fields = this.getNodeParameter('updateFields', {}) as IDataObject;
	const body: IDataObject = {};
	if (fields.title !== undefined) body.title = fields.title;
	if (fields.description !== undefined) body.description = fields.description;
	if (fields.safetyInformation !== undefined) body.safety_information = fields.safetyInformation;
	const tags = splitTags(fields.tags);
	if (tags) body.tags = tags;
	if (fields.blueprintId !== undefined) body.blueprint_id = toNumber(fields.blueprintId);
	if (fields.printProviderId !== undefined) {
		body.print_provider_id = toNumber(fields.printProviderId);
	}
	if (fields.variants !== undefined) body.variants = parseJson(this, fields.variants, 'Variants');
	if (fields.printAreas !== undefined) {
		body.print_areas = parseJson(this, fields.printAreas, 'Print Areas');
	}
	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(this.getNode(), "Add at least one field under 'Update Fields'");
	}
	requestOptions.body = body;
	return requestOptions;
}

/**
 * preSend for Webhook > Delete. Printify only deletes a webhook when the `host` query parameter
 * matches the webhook URL's hostname, so look the webhook up and add it.
 */
export async function addWebhookHost(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const shopId = this.getNodeParameter('shopId', '', { extractValue: true }) as string;
	const webhookId = this.getNodeParameter('webhookId', '', { extractValue: true }) as string;
	const webhooks = (await printifyApiRequest.call(
		this,
		'GET',
		`/v1/shops/${shopId}/webhooks.json`,
	)) as Array<{ id: string; url: string }>;
	const match = webhooks.find((w) => String(w.id) === String(webhookId));
	if (!match) {
		throw new NodeOperationError(
			this.getNode(),
			`Webhook ${webhookId} was not found in shop ${shopId}`,
			{ description: 'It may already be deleted. Use Webhook > Get Many to see what exists' },
		);
	}
	requestOptions.qs = { ...(requestOptions.qs ?? {}), host: new URL(match.url).hostname };
	return requestOptions;
}

/** preSend for Upload > Upload: URL, base64 string, or a binary property of the input item. */
export async function buildUploadBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const source = this.getNodeParameter('source', 'url') as string;
	const fileName = this.getNodeParameter('fileName', '') as string;
	const body: IDataObject = { file_name: fileName };

	if (source === 'url') {
		body.url = this.getNodeParameter('url', '') as string;
	} else if (source === 'base64') {
		body.contents = this.getNodeParameter('contents', '') as string;
	} else {
		const propertyName = this.getNodeParameter('binaryPropertyName', 'data') as string;
		const binary = this.helpers.assertBinaryData(propertyName);
		const buffer = await this.helpers.getBinaryDataBuffer(propertyName);
		body.contents = buffer.toString('base64');
		if (!fileName) body.file_name = binary.fileName ?? 'upload.png';
	}

	requestOptions.body = body;
	return requestOptions;
}

export const PUBLISH_FIELDS = [
	'title',
	'description',
	'images',
	'variants',
	'tags',
	'keyFeatures',
	'shipping_template',
];

/** preSend that builds the publish body from the "Fields to Publish" multi-select. */
export async function buildPublishBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const selected = this.getNodeParameter('publishFields', PUBLISH_FIELDS) as string[];
	const body: IDataObject = {};
	for (const field of PUBLISH_FIELDS) body[field] = selected.includes(field);
	requestOptions.body = body;
	return requestOptions;
}

function pick(source: IDataObject, keys: string[]): IDataObject {
	const out: IDataObject = {};
	for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
	return out;
}

/** postReceive that trims a product to its most used fields when "Simplify" is on. */
export async function simplifyProduct(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const simplify = this.getNodeParameter('simplify', true) as boolean;
	if (!simplify) return items;
	return items.map((item) => {
		const p = item.json;
		const variants = (p.variants as IDataObject[]) ?? [];
		const images = (p.images as IDataObject[]) ?? [];
		const defaultImage = images.find((i) => i.is_default) ?? images[0];
		return {
			json: {
				...pick(p, ['id', 'title', 'tags', 'visible', 'blueprint_id', 'print_provider_id']),
				enabled_variants: variants.filter((v) => v.is_enabled).length,
				image_url: defaultImage?.src ?? null,
				created_at: p.created_at,
				updated_at: p.updated_at,
			},
			pairedItem: item.pairedItem,
		};
	});
}

/** postReceive that trims an order to its most used fields when "Simplify" is on. */
export async function simplifyOrder(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const simplify = this.getNodeParameter('simplify', true) as boolean;
	if (!simplify) return items;
	return items.map((item) => {
		const o = item.json;
		const address = (o.address_to as IDataObject) ?? {};
		const shipments = (o.shipments as IDataObject[]) ?? [];
		return {
			json: {
				...pick(o, ['id', 'status', 'total_price', 'total_shipping', 'shipping_method']),
				customer: [address.first_name, address.last_name].filter(Boolean).join(' '),
				country: address.country ?? null,
				line_items: ((o.line_items as IDataObject[]) ?? []).length,
				tracking_url: shipments[0]?.url ?? null,
				created_at: o.created_at,
			},
			pairedItem: item.pairedItem,
		};
	});
}
