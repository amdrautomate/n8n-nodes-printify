import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export const PRINTIFY_BASE_URL = 'https://api.printify.com';
export const USER_AGENT = 'n8n-nodes-printify';

/**
 * Authenticated request against the Printify public API.
 * Used by list searches and by the trigger; the action node routes declaratively.
 */
export async function printifyApiRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
) {
	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: `${PRINTIFY_BASE_URL}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json;charset=utf-8',
			'User-Agent': USER_AGENT,
		},
		json: true,
	};

	if (body === undefined) {
		delete options.body;
	}

	return await this.helpers.httpRequestWithAuthentication.call(this, 'printifyApi', options);
}
