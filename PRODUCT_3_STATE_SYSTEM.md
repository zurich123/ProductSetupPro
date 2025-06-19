# Product 3-State System: Active/Inactive/Draft

## Overview
The product management system now supports a proper 3-state system for product status management, replacing the previous 2-state Active/Not for Sale system.

## The 3 Product States

### 1. **Active**
- **Database**: `active: true, not_for_sale: false`
- **Meaning**: Product is live and available for purchase
- **Customer Visibility**: Visible in catalogs and search results
- **Purchase Availability**: Can be purchased by customers
- **Use Case**: Products ready for market

### 2. **Inactive** 
- **Database**: `active: false, not_for_sale: true`
- **Meaning**: Product exists but is not available for purchase
- **Customer Visibility**: May be visible in catalogs (depending on business rules)
- **Purchase Availability**: Cannot be purchased
- **Use Case**: Discontinued products, seasonal items out of season, products under review

### 3. **Draft**
- **Database**: `active: false, not_for_sale: false`
- **Meaning**: Product is work-in-progress and not ready for customers
- **Customer Visibility**: Hidden from customers completely
- **Purchase Availability**: Cannot be purchased
- **Use Case**: New products under development, testing products, incomplete configurations

## State Transitions

### Typical Product Lifecycle
```
Draft → Active → Inactive
  ↑       ↓         ↓
  ←←←←←←←←←←←←←←←←←←←
```

### Allowed Transitions
- **Draft → Active**: Product development complete, ready for launch
- **Active → Inactive**: Product discontinued or temporarily unavailable
- **Inactive → Active**: Product re-activated for sale
- **Active → Draft**: Product pulled for major revisions
- **Inactive → Draft**: Product being reworked
- **Draft → Inactive**: Product completed but not yet launched

## Implementation Details

### Database Schema
```sql
-- Existing boolean fields used to represent 3 states
active: boolean
not_for_sale: boolean

-- State combinations:
-- Active:   active=true,  not_for_sale=false
-- Inactive: active=false, not_for_sale=true  
-- Draft:    active=false, not_for_sale=false
```

### API Schema
```typescript
product_status: z.enum(["active", "inactive", "draft"]).default("draft")
```

### UI Implementation
Radio button group with descriptive labels:
- **Active**: "Available for purchase and visible to customers"
- **Inactive**: "Not available for purchase but visible"
- **Draft**: "Work in progress, not visible to customers"

## Business Rules

### Default State
- New products default to **Draft** status
- Prevents accidental publication of incomplete products
- Requires explicit activation to make products live

### State Validation
- Only one state can be active at a time (mutually exclusive)
- Database constraints prevent invalid combinations
- UI prevents selection of conflicting states

### Customer Experience
| State | Catalog Visibility | Search Results | Purchase Button | Product Page Access |
|-------|-------------------|----------------|-----------------|-------------------|
| Active | ✓ Visible | ✓ Visible | ✓ Enabled | ✓ Accessible |
| Inactive | ⚠️ Configurable | ⚠️ Configurable | ❌ Disabled | ✓ Accessible |
| Draft | ❌ Hidden | ❌ Hidden | ❌ Disabled | ❌ Admin Only |

## API Examples

### Create Draft Product
```json
POST /api/products
{
  "name": "New Product",
  "sku": "NEW-001",
  "brand_id": 1,
  "version_name": "v1.0",
  "base_price": 99.99,
  "product_status": "draft"
}
```

### Create Active Product
```json
POST /api/products
{
  "name": "Launch Ready Product",
  "sku": "READY-001", 
  "brand_id": 1,
  "version_name": "v1.0",
  "base_price": 99.99,
  "product_status": "active"
}
```

### Update Product Status
```json
PATCH /api/products/[id]
{
  "product_status": "inactive"
}
```

## Validation Results

### Test Cases Verified
✓ **Draft Product**: `active: false, not_for_sale: false`
✓ **Inactive Product**: `active: false, not_for_sale: true`  
✓ **Active Product**: `active: true, not_for_sale: false`

### Form Behavior
✓ Default new products to Draft status
✓ Radio button selection properly sets single state
✓ Editing existing products preserves correct state
✓ State descriptions help users understand options

## Migration from 2-State System

### Existing Data Mapping
- `active: true, not_for_sale: false` → **Active**
- `active: false, not_for_sale: true` → **Inactive** 
- `active: false, not_for_sale: false` → **Draft**
- `active: true, not_for_sale: true` → **Invalid** (should not exist)

### Backward Compatibility
- Database structure unchanged (still uses boolean fields)
- API converts between enum and boolean representations
- No breaking changes to existing integrations

## Business Benefits

### Product Management
- Clear workflow for product development lifecycle
- Prevents accidental publication of incomplete products
- Allows product managers to prepare launches in advance

### Quality Control
- Draft state enables thorough review before publication
- Inactive state preserves product data while removing from sale
- Clear state transitions support approval workflows

### Customer Experience
- Customers only see appropriate products
- No confusion from products that can't be purchased
- Better search and catalog organization

## Future Enhancements

### Potential Additions
- **State History**: Track when products change states and who changed them
- **Scheduled Transitions**: Automatically activate products at specific times
- **Workflow Integration**: Require approvals for certain state changes
- **Bulk Operations**: Change status of multiple products simultaneously

### Advanced Features
- **Preview Mode**: Allow authorized users to view draft products
- **A/B Testing**: Support multiple versions in different states
- **Inventory Integration**: Auto-transition to inactive when out of stock

This 3-state system provides clear product lifecycle management while maintaining backward compatibility and improving the user experience for both administrators and customers.