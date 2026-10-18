import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeListSearchItems,
	INodeListSearchResult,
} from 'n8n-workflow';
import { printifyApiRequest } from '../shared/transport';

function matches(filter: string | undefined, ...fields: unknown[]): boolean {
	if (!filter) return true;
	const needle = filter.toLowerCase();
	return fields.some((f) => String(f ?? '').toLowerCase().includes(needle));
}

function currentId(this: ILoadOptionsFunctions, name: string): string {
	try {
		return String(this.getCurrentNodeParameter(name, { extractValue: true }) ?? '');
	} catch {
		return '';
	}
}

export async function getShops(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const shops = (await printifyApiRequest.call(this, 'GET', '/v1/shops.json')) as IDataObject[];
	const results: INodeListSearchItems[] = shops
		.filter((s) => matches(filter, s.title, s.sales_channel, s.id))
		.map((s) => ({
			name: `${s.title} (${s.sales_channel})`,
			value: String(s.id),
		}));
	return { results };
}

export async function getProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const shopId = currentId.call(this, 'shopId');
	if (!shopId) return { results: [] };
	const page = paginationToken ? Number(paginationToken) : 1;
	const response = (await printifyApiRequest.call(
		this,
		'GET',
		`/v1/shops/${shopId}/products.json`,
		{ limit: 50, page },
	)) as { data: IDataObject[]; current_page: number; last_page: number };
	const results: INodeListSearchItems[] = (response.data ?? [])
		.filter((p) => matches(filter, p.title, p.id))
		.map((p) => ({
			name: String(p.title),
			value: String(p.id),
			url: `https://printify.com/app/products/${p.id}`,
		}));
	const next = response.current_page < response.last_page ? String(response.current_page + 1) : undefined;
	return { results, paginationToken: next };
}

export async function getBlueprints(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const blueprints = (await printifyApiRequest.call(
		this,
		'GET',
		'/v1/catalog/blueprints.json',
	)) as IDataObject[];
	const results: INodeListSearchItems[] = blueprints
		.filter((b) => matches(filter, b.title, b.brand, b.model, b.id))
		.slice(0, 200)
		.map((b) => ({
			name: `${b.title} (${b.brand} ${b.model})`.trim(),
			value: String(b.id),
		}));
	return { results };
}

export async function getPrintProviders(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const blueprintId = currentId.call(this, 'blueprintId');
	const endpoint = blueprintId
		? `/v1/catalog/blueprints/${blueprintId}/print_providers.json`
		: '/v1/catalog/print_providers.json';
	const providers = (await printifyApiRequest.call(this, 'GET', endpoint)) as IDataObject[];
	const results: INodeListSearchItems[] = providers
		.filter((p) => matches(filter, p.title, p.id))
		.map((p) => {
			const location = p.location as IDataObject | undefined;
			const where = location?.country ? ` (${location.country})` : '';
			return { name: `${p.title}${where}`, value: String(p.id) };
		});
	return { results };
}

export async function getUploads(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? Number(paginationToken) : 1;
	const response = (await printifyApiRequest.call(this, 'GET', '/v1/uploads.json', {
		limit: 100,
		page,
	})) as { data: IDataObject[]; current_page: number; last_page: number };
	const results: INodeListSearchItems[] = (response.data ?? [])
		.filter((u) => matches(filter, u.file_name, u.id))
		.map((u) => ({
			name: `${u.file_name} (${u.width}x${u.height})`,
			value: String(u.id),
			url: u.preview_url ? String(u.preview_url) : undefined,
		}));
	const next = response.current_page < response.last_page ? String(response.current_page + 1) : undefined;
	return { results, paginationToken: next };
}

export async function getWebhooks(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	const shopId = currentId.call(this, 'shopId');
	if (!shopId) return { results: [] };
	const webhooks = (await printifyApiRequest.call(
		this,
		'GET',
		`/v1/shops/${shopId}/webhooks.json`,
	)) as IDataObject[];
	const results: INodeListSearchItems[] = webhooks
		.filter((w) => matches(filter, w.topic, w.url, w.id))
		.map((w) => ({ name: `${w.topic} → ${w.url}`, value: String(w.id) }));
	return { results };
}
