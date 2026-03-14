# Customer Account Hub Authoring Runbook

## Scope

This runbook defines the required DA composition for `/customer/account` and the canonical left navigation rows for B2B account pages.

## `/customer/account` Composition

Use a `body.columns` layout with this exact right-column order:

1. `commerce-account-header`
2. `commerce-account-hub`
3. `commerce-orders-list` with `minified-view=true`
4. `commerce-addresses` with `minified-view=true`

Use this exact left-column block:

1. `commerce-account-nav`

Recommended `commerce-account-hub` config row values:

| key | value |
| --- | --- |
| `title` | `My account` |
| `rows-limit` | `3` |
| `show-orders` | `true` |
| `show-addresses` | `true` |
| `show-module-cards` | `false` |
| `guest-cta-label` | `Sign in` |
| `guest-cta-href` | `/customer/login` |

Enable `show-module-cards=true` only when you want the deferred Tier 3 module summary calls.

## Canonical `commerce-account-nav` Rows

Author nav as table rows using columns: `label`, `icon`, `permission`.

| Label (title + subtitle) | Icon | Permission |
| --- | --- | --- |
| `My account` / `Account details` | `user` | `all` |
| `Orders` / `Track, manage, and return` | `cube` | `all` |
| `Addresses` / `Manage your locations` | `address-book` | `all` |
| `Returns` / `Manage your returns` | `box` | `all` |
| `Requisition Lists` / `Manage your requisition lists` | `list` | `Magento_RequisitionList::requisition_list,Magento_RequisitionList::view` |
| `Company Profile` / `Manage company` | `briefcase` | `Magento_Company::view` |
| `Company Structure` / `Manage company structure` | `align-left` | `Magento_Company::view` |
| `Company Users` / `Manage company users` | `users` | `Magento_Company::users_view` |
| `Roles and Permissions` / `Manage roles and permissions` | `lock` | `Magento_Company::roles_view` |
| `Company Credit` / `View company credit history` | `credit-card` | `Magento_CompanyCredit::view` |
| `Quotes` / `Manage negotiable quotes` | `quote` | `Magento_NegotiableQuote::all,Magento_NegotiableQuote::view_quotes` |
| `Quote Templates` / `Manage negotiable quote templates` | `copy` | `Magento_NegotiableQuoteTemplate::all,Magento_NegotiableQuoteTemplate::view_template` |

## Permission Parsing Contract

`commerce-account-nav` supports:

- Single permission key
- Comma-separated permission keys
- Newline-separated permission keys

Grant semantics are OR across keys. Explicit disable semantics always win:

- `isExplicitlyDisabled = any key with value === false`
- Item renders only when `!isExplicitlyDisabled && isGranted`

## Route Safety

Do not change these route contracts:

- `/customer/account`
- `/customer/orders`
- `/customer/address`
- `/customer/company`
- `/customer/company/structure`
- `/customer/company/users`
- `/customer/company/roles`
- `/customer/company/credit`
- `/customer/negotiable-quote`
- `/customer/negotiable-quote-template`
- `/customer/requisition-lists`

Each module route should keep the page composition pattern:

1. `commerce-account-header`
2. `commerce-account-nav`
3. Route module block (single module)

## DA Execution Notes

If mounted DA content access is available at delivery time, apply the composition updates directly in DA.  
If mounted access is not available, use this runbook as the handoff artifact for content authors.
