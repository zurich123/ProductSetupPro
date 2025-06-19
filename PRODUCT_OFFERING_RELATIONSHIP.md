# Product and Offering Table Relationship

## Important Clarification

In our database schema, **there is no separate "product" table**. The **`offering` table IS the product table**.

## Why "Offering" Instead of "Product"?

The term "offering" was chosen because it's more comprehensive than "product":

- **Product** typically refers to a physical item
- **Offering** can include products, services, bundles, or combinations thereof

## The Offering Table Structure

```sql
offering (this IS the product table)
├── offering_id (Primary Key - UUID)
├── name (Product name)
├── sku (Product SKU - shared across all versions)
├── description_short
├── description_long
├── active (Is product available)
├── not_for_sale (Is it just for display)
└── sequence_order (Display order)
```

## Key Relationships

### 1. Offering ↔ Brands
```
offering.offering_id → offering_brand.offering_id
offering_brand.brand_id → brand_lookup.id
```
**Meaning**: Each product belongs to one brand

### 2. Offering ↔ Ecosystems  
```
offering_brand.brand_id → ecosystem.brand_id
```
**Meaning**: Products are categorized by business ecosystem (Healthcare, Dental, etc.)

### 3. Offering ↔ Versions
```
offering.offering_id → sku_version.offering_id
```
**Meaning**: Each product can have multiple versions (Standard, Premium, Pro)

### 4. Versions ↔ Pricing
```
sku_version.sku_version_id → sku_version_pricing.sku_version_detail_id
```
**Meaning**: Each version has its own pricing structure

## Data Flow Example

```
Offering (Product): "Smart Blood Pressure Monitor"
├── SKU: "SBP-001" (shared by all versions)
├── Brand: "Acme Healthcare"
├── Ecosystem: "Healthcare"
└── Versions:
    ├── Version 1: "Standard Edition"
    │   └── Pricing: $79.99 base, $99.99 MSRP
    └── Version 2: "Professional Edition"
        └── Pricing: $129.99 base, $159.99 MSRP
```

## Why This Structure?

### Business Benefits
1. **One SKU per product family**: Easier for customers to understand
2. **Version flexibility**: Add new versions without changing core product info
3. **Pricing independence**: Each version can have different pricing strategies
4. **Brand organization**: Clear hierarchy from brand → product → versions

### Technical Benefits
1. **Data normalization**: No duplicate product information
2. **Scalable versioning**: Easy to add new versions
3. **Relationship clarity**: Clear foreign key relationships
4. **Query efficiency**: Optimized for common business queries

## Common Queries

### Get all products with their brands:
```sql
SELECT o.name, o.sku, b.name as brand_name 
FROM offering o
JOIN offering_brand ob ON o.offering_id = ob.offering_id
JOIN brand_lookup b ON ob.brand_id = b.id
```

### Get all versions of a specific product:
```sql
SELECT o.name, o.sku, sv.version_name, svp.base_price
FROM offering o
JOIN sku_version sv ON o.offering_id = sv.offering_id
JOIN sku_version_pricing svp ON sv.sku_version_id = svp.sku_version_detail_id
WHERE o.offering_id = 'specific-uuid'
```

## Summary

- **offering** = **product** (they are the same thing)
- The naming reflects that we can sell products, services, or bundles
- All product information is centralized in the offering table
- Versions and pricing are separate entities that reference the main offering
- This structure enforces the rule that versions share the same SKU