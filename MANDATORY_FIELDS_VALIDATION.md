# Product Creation: Mandatory Fields Validation Rules

## Overview
The product management system enforces strict validation rules to ensure data integrity and business rule compliance. This document outlines exactly which fields are required when creating a product.

---

## Mandatory Fields (Required)

### 1. Basic Product Information

| Field | Type | Validation | Business Rule |
|-------|------|------------|---------------|
| `name` | string | min 1 character | Product name is required |
| `sku` | string | min 1 character | SKU is required |
| `brand_id` | number | min 1 | Brand is required |

### 2. Version Information

| Field | Type | Validation | Business Rule |
|-------|------|------------|---------------|
| `version_name` | string | min 1 character | Version name is required |

### 3. Pricing Information

| Field | Type | Validation | Business Rule |
|-------|------|------------|---------------|
| `base_price` | number | must be positive | Base price must be positive |

---

## Auto-Derived Fields

### Ecosystem Assignment
- **`ecosystem_id`** - Automatically derived from selected brand
- Users cannot manually set ecosystem
- System looks up brand's ecosystem and assigns automatically
- Falls back to first available ecosystem if brand has no ecosystem assigned

---

## Optional Fields with System Defaults

### Status Fields
- **`active`** - Default: `true`
- **`not_for_sale`** - Default: `false`

### Educational Fields
- **`qualifying_education`** - Default: `false`
- **`continuing_education`** - Default: `false`

### Content Fields
- **`hybrid_delivery`** - Default: `false`
- **`mobile_compatible`** - Default: `false`

### Assignment Fields
- **`fulfillment_platform_ids`** - Default: `[]` (empty array)
- **`feature_ids`** - Default: `[]` (empty array)

---

## Validation Error Examples

### Missing Required Fields
```json
POST /api/products
{
  "name": "Test Product"
}

Response:
{
  "message": "Validation error",
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["sku"],
      "message": "Required"
    },
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "undefined",
      "path": ["brand_id"],
      "message": "Required"
    },
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["version_name"],
      "message": "Required"
    },
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "undefined",
      "path": ["base_price"],
      "message": "Required"
    }
  ]
}
```

### Minimum Valid Product
```json
POST /api/products
{
  "name": "Minimal Product Test",
  "sku": "MINIMAL-001",
  "brand_id": 1,
  "version_name": "Basic Version",
  "base_price": 99.99
}

Response: 201 Created
{
  "offering_id": "uuid-here",
  "name": "Minimal Product Test",
  "sku": "MINIMAL-001",
  "active": true,
  "not_for_sale": false,
  "offering_brands": [{
    "brand_id": 1,
    "brand": {
      "name": "Acme Healthcare",
      "ecosystem_id": 1
    }
  }],
  "sku_versions": [{
    "version_name": "Basic Version",
    "sku_version_detail": {
      "active": true,
      "qualifying_education": false,
      "continuing_education": false,
      "hybrid_delivery": false,
      "sku_version_pricing": [{
        "base_price": 99.99
      }]
    }
  }]
}
```

---

## Optional Enhanced Fields

### Product Descriptions
- `description_short` - Brief product summary
- `description_long` - Detailed product description
- `sequence_order` - Display order (0-255)

### Educational Content
- `credit_hours` - CE credits awarded
- `access_period` - How long users have access
- `platform` - Delivery platform description
- `certifications_awarded` - Certifications provided
- `owner` - Content owner/instructor

### Advanced Pricing
- `msrp` - Manufacturer's suggested retail price
- `cogs` - Cost of goods sold
- `delivery_cost` - Shipping/delivery costs
- `subscription_price` - Monthly subscription option
- `promotional_price` - Discounted pricing
- `discount_percentage` - Discount amount (0-100%)
- `recognition_period_months` - Revenue recognition period
- `additional_certificate_price` - Extra certificate cost

### Revenue Recognition
- `revenue_allocation_method` - How revenue is recognized
- `discount_eligibility` - Who qualifies for discounts
- `discount_type` - Type of discount offered
- `recognition_start_trigger` - When to start recognizing revenue

### Content Details
- `content_format` - Format description (video, text, etc.)
- `content_length` - Duration or length of content
- `instructor_information` - Instructor bio/credentials

---

## Business Rule Enforcement

### 1. Brand-Ecosystem Derivation
When a user selects a brand, the system:
1. Looks up the brand in `brand_lookup` table
2. Retrieves the associated `ecosystem_id`
3. Automatically assigns this ecosystem to the product
4. User cannot override this assignment

### 2. SKU Uniqueness
- SKU must be unique across all products
- Multiple versions of the same product share the same SKU
- System prevents SKU conflicts during creation

### 3. Version Requirements
- Every product must have at least one version
- Version name is required for identification
- Each version can have unique specifications and pricing

### 4. Pricing Validation
- Base price is required and must be positive
- Optional pricing fields (MSRP, COGS, etc.) must be non-negative if provided
- Discount percentage must be between 0-100%

---

## UI Form Behavior

### Required Field Indicators
- Required fields show red asterisk (*)
- Form submission blocked until all required fields completed
- Real-time validation messages for invalid inputs

### Brand Selection Impact
- Brand dropdown is required field
- Ecosystem field becomes read-only after brand selection
- Ecosystem automatically populates based on brand choice

### Pricing Section
- Base price is required field with currency formatting
- Optional pricing fields can be left empty
- System validates numeric inputs and ranges

### Feature Assignment
- Feature selection is optional
- Multiple features can be selected
- Features contribute to product value differentiation

---

## Validation Implementation

### Schema Location
File: `shared/schema.ts`
Schema: `productFormSchema`

### Server Validation
File: `server/routes.ts`
Route: `POST /api/products`

### Error Handling
- Zod schema validation catches field-level errors
- Business rule validation occurs after schema validation
- Database constraints provide final validation layer

### Response Format
```json
{
  "message": "Validation error",
  "errors": [
    {
      "code": "validation_code",
      "expected": "expected_type",
      "received": "received_type", 
      "path": ["field_name"],
      "message": "Human readable message"
    }
  ]
}
```

This validation system ensures data integrity while providing clear feedback to users about what information is required versus optional for product creation.