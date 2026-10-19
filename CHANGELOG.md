# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-10-19

### Changed

- Publish through npm trusted publishing (GitHub Actions OIDC) instead of a token; no functional changes.
- Normalized the repository URL in package.json.

## [0.1.0] - 2026-10-19

### Added

- **Printify** node with Shop, Blueprint, Print Provider, Product, Order, Upload and Webhook
  resources (32 operations). Shops, products, blueprints, print providers, images and webhooks
  can be picked from a list or given by ID. Get Many operations page through results with
  Return All and Limit. Product and Order reads have a Simplify toggle.
- Order create and Calculate Shipping accept line items as a form (product + variant, or SKU)
  or as raw Printify JSON.
- Upload from a URL, a binary field on the incoming item, or base64 text.
- Errors carry Printify's own reason text instead of a generic HTTP message.
- **Printify Trigger** that registers one webhook per selected event with a random secret,
  verifies the `X-Pfy-Signature` HMAC on every delivery, and removes the webhooks on deactivate.
- Works as a tool for n8n AI agents.
