# Status Filter Fix Validation

## Issue Identified
The status filter logic was incorrectly mapping Draft and Inactive states:
- Draft filter was showing Inactive products
- Inactive filter was showing Draft products

## Root Cause
The `getProductStatus` function in the product table had incorrect logic:
```typescript
// INCORRECT (before fix)
const getProductStatus = (product: ProductWithRelations) => {
  if (product.not_for_sale) return "Draft";  // WRONG
  return product.active ? "Active" : "Inactive";  // INCOMPLETE
};
```

## Correct 3-State Logic
```typescript
// CORRECT (after fix)
const getProductStatus = (product: ProductWithRelations) => {
  // Active: active=true, not_for_sale=false
  if (product.active && !product.not_for_sale) return "Active";
  
  // Inactive: active=false, not_for_sale=true  
  if (!product.active && product.not_for_sale) return "Inactive";
  
  // Draft: active=false, not_for_sale=false
  if (!product.active && !product.not_for_sale) return "Draft";
  
  return "Unknown";
};
```

## Database State Mapping
| active | not_for_sale | Status   | Customer Impact |
|--------|-------------|----------|-----------------|
| true   | false       | Active   | Visible + Purchasable |
| false  | true        | Inactive | Visible + Not Purchasable |
| false  | false       | Draft    | Hidden from customers |

## Test Data Verification
From database query:
- "Draft Product Test": active=false, not_for_sale=false → Draft ✓
- "Inactive Product Test": active=false, not_for_sale=true → Inactive ✓
- "Active Product Test": active=true, not_for_sale=false → Active ✓

## Fix Applied
Updated the `getProductStatus` function in `client/src/components/product-table.tsx` to correctly interpret the boolean field combinations according to the 3-state system specification.

This ensures that:
1. Draft filter shows only products with active=false, not_for_sale=false
2. Inactive filter shows only products with active=false, not_for_sale=true
3. Active filter shows only products with active=true, not_for_sale=false