import type { INodeProperties } from 'n8n-workflow';
import { uploadSelect } from '../shared/descriptions';
import { buildUploadBody, paginationProperties, unwrapData } from '../shared/routing';

const resource = ['upload'];

export const uploadDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Archive',
				value: 'archive',
				action: 'Archive an uploaded image',
				description: 'Hide an uploaded image from the media library',
				routing: {
					request: { method: 'POST', url: '=/v1/uploads/{{$parameter.imageId}}/archive.json' },
					output: {
						postReceive: [{ type: 'set', properties: { value: '={{ { "archived": true } }}' } }],
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an uploaded image',
				description: 'Get an uploaded image with its size and preview URL',
				routing: {
					request: { method: 'GET', url: '=/v1/uploads/{{$parameter.imageId}}.json' },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many uploaded images',
				description: 'List the images in the media library',
				routing: {
					request: { method: 'GET', url: '/v1/uploads.json' },
					output: { postReceive: [unwrapData] },
				},
			},
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload an image',
				description: 'Add an image to the media library from a URL, a binary file or base64 text',
				routing: {
					request: { method: 'POST', url: '/v1/uploads/images.json' },
					send: { preSend: [buildUploadBody] },
				},
			},
		],
		default: 'upload',
	},
	{
		...uploadSelect,
		displayOptions: { show: { resource, operation: ['archive', 'get'] } },
	},

	// ---- Upload ----
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		default: 'url',
		displayOptions: { show: { resource, operation: ['upload'] } },
		options: [
			{ name: 'Base64 Text', value: 'base64', description: 'Image bytes as a base64 string' },
			{ name: 'Binary File', value: 'binary', description: 'A binary field on the incoming item' },
			{ name: 'URL', value: 'url', description: 'A public image URL Printify can download' },
		],
	},
	{
		displayName: 'File Name',
		name: 'fileName',
		type: 'string',
		default: '',
		placeholder: 'e.g. front-design.png',
		displayOptions: { show: { resource, operation: ['upload'] } },
		description: 'Name to store the image under. Left empty for a binary file, the file\'s own name is used.',
	},
	{
		displayName: 'Image URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. https://example.com/front-design.png',
		displayOptions: { show: { resource, operation: ['upload'], source: ['url'] } },
	},
	{
		displayName: 'Input Binary Field',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		displayOptions: { show: { resource, operation: ['upload'], source: ['binary'] } },
		hint: 'The name of the input binary field containing the image',
	},
	{
		displayName: 'Base64 Contents',
		name: 'contents',
		type: 'string',
		default: '',
		required: true,
		typeOptions: { rows: 3 },
		displayOptions: { show: { resource, operation: ['upload'], source: ['base64'] } },
		description: 'Base64-encoded image bytes, without a data URL prefix',
	},

	// ---- Get Many ----
	...paginationProperties({ resource, operation: ['getAll'] }, 100),
];
