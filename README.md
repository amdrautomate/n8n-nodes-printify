# n8n-nodes-printify

An [n8n](https://n8n.io) community node for [Printify](https://printify.com), the print-on-demand platform. Create products from the catalog, upload designs, place and track orders, manage webhooks, and start workflows when orders ship. The Printify node also works as a tool for n8n AI agents.

[Installation](#installation) · [Credentials](#credentials) · [Printify node](#printify-node) · [Printify Trigger](#printify-trigger) · [Example workflows](#example-workflows) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) and install the package name:

```
@amdrautomate/n8n-nodes-printify
```

## Credentials

Both nodes use a Printify **Personal Access Token**.

1. In Printify, open **My Profile → Connections** (https://printify.com/app/account/api).
2. Click **Generate** under Personal Access Tokens, choose the scopes you need (shops, catalog, products, orders, uploads, webhooks), and copy the token. It is shown once and is valid for one year.
3. In n8n, create a **Printify API** credential and paste the token.

The credential test lists your shops, so a green check means the token works.

## Printify node

| Resource | Operations |
|---|---|
| **Shop** | Get Many |
| **Blueprint** (catalog) | Get, Get Many, Get Print Providers, Get Shipping, Get Size Guide, Get Variants |
| **Print Provider** | Get, Get Many |
| **Product** | Create, Delete, Get, Get Many, Publish, Unpublish, Mark Publish Succeeded, Mark Publish Failed, Update |
| **Order** | Create, Get, Get Many, Cancel, Send to Production, Calculate Shipping |
| **Upload** | Upload (from URL, binary file or base64), Get, Get Many, Archive |
| **Webhook** | Create, Delete, Get Many, Update |

Notes:

- Shops, products, blueprints, print providers, images and webhooks can be picked **from a list** or given by ID.
- **Get Many** operations support **Return All** and **Limit**, and page through Printify's results for you.
- **Product** and **Order** reads have a **Simplify** toggle (on by default) that returns the ten most useful fields. Turn it off for the raw Printify response.
- **Order → Create** accepts line items as a form (product + variant ID, or SKU) or as raw Printify JSON for advanced cases such as print-on-the-fly line items.
- Prices and costs are in **cents**, as in the Printify API.

## Printify Trigger

Starts a workflow when something happens in a shop. Pick the shop and one or more events:

`order:created`, `order:updated`, `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`, `product:created`, `product:updated`, `product:deleted`, `product:publish:started`, `personalization-preview-task:processed`, `shop:disconnected`

When you activate the workflow the trigger registers the webhooks in Printify with a random secret, and it removes them when you deactivate. Every delivery is checked against the `X-Pfy-Signature` header (HMAC SHA-256), and requests that fail the check are rejected with 401. Each output item is the Printify event: `id`, `type`, `created_at` and `resource` (with `resource.data` holding the order or product details).

## Example workflows

### 1. Design → product → published

1. **Upload → Upload** with the design URL (or a binary image from a previous node). Keep the returned `id`.
2. **Blueprint → Get Variants** for your blueprint and print provider to find the variant IDs you want to sell.
3. **Product → Create** with the title, blueprint, print provider, a `variants` array (IDs + price in cents) and `print_areas` that reference the uploaded image ID.
4. **Product → Publish** to push it to the connected store.

### 2. Store order → Printify order

1. Trigger on a new order in your store (Shopify, WooCommerce, a form, a webhook).
2. **Order → Calculate Shipping** to show the customer the cost, if you need it.
3. **Order → Create** with the line items (product + variant ID or SKU), the shipping address and your order number as `External ID`.
4. **Order → Send to Production** once payment is confirmed.

### 3. Shipping notifications

1. **Printify Trigger** with the event `order:shipment:created`.
2. **Printify → Order → Get** with `{{ $json.resource.id }}` to load the full order.
3. Email or message the customer with the carrier and tracking number from `resource.data`.

## Compatibility

Tested end to end against the live Printify API with n8n 2.43 (node and trigger). Requires Node.js 20.15 or newer, matching n8n's own requirement.

## Resources

- [Printify API documentation](https://developers.printify.com/)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## Development

```bash
npm install
npm run lint     # n8n node linter
npm run build    # compile to dist/
npm run dev      # start a local n8n with this node loaded
```

## License

[MIT](LICENSE.md)
