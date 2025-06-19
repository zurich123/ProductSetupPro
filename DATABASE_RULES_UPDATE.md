# Database Schema Update: SKU Management Rules

## Summary of Changes

We have updated the database schema to enforce the rule that **different versions of the same product share the same SKU**.

## What Changed

### Before the Update
- Each SKU version had its own unique SKU number
- Products could have multiple different SKUs for different versions
- SKU was stored in the `sku_version` table

### After the Update
- **One product = One SKU**: All versions of a product share the same SKU
- SKU is now stored at the product level in the `offering` table
- Versions are differentiated by `version_name` (e.g., "Standard", "Premium", "Pro")

## Technical Changes

### Schema Updates
1. **Moved SKU field**: From `sku_version` table to `offering` table
2. **Added relationship**: `sku_version` now references `offering_id` directly
3. **Enforced constraints**: SKU and offering_id are now required fields

### Data Migration
- Existing SKUs were preserved and moved to the product level
- Version names were maintained for differentiation
- All relationships were updated to maintain data integrity

## Business Impact

### For Product Managers
- **Simplified SKU Management**: One SKU per product family
- **Clear Version Hierarchy**: Versions are clearly related under one SKU
- **Easier Inventory**: Track all versions under a single SKU umbrella

### Example Structure
**Before:**
- Product: "Blood Pressure Monitor"
  - Version 1: SKU "BPM-001-STD" 
  - Version 2: SKU "BPM-002-PRO"

**After:**
- Product: "Blood Pressure Monitor" - SKU "BPM-001"
  - Version 1: "Standard Edition"
  - Version 2: "Professional Edition"

### Benefits
1. **Consistent Branding**: One SKU represents the entire product line
2. **Easier Customer Understanding**: Customers see one SKU with multiple options
3. **Simplified Ordering**: Order by SKU, specify version preference
4. **Better Analytics**: Track performance across all versions of a product

## Application Updates

The product management interface has been updated to reflect these changes:
- SKU is entered once per product
- Versions are managed as separate entities with pricing
- Forms and displays updated to show the new structure
- Search functionality works with the consolidated SKU approach

## Future Capabilities

This structure enables:
- **Version Management**: Easy addition of new versions to existing products
- **Pricing Strategies**: Different pricing for different versions of the same SKU
- **Inventory Control**: Manage stock levels per version while maintaining SKU unity
- **Customer Choice**: Present options under a single product umbrella

The updated system maintains all existing functionality while providing a cleaner, more logical structure for product and version management.