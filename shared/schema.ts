import { pgTable, text, serial, integer, boolean, decimal, uuid, varchar, bigint, timestamp, smallint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Ecosystem table
export const ecosystem = pgTable("ecosystem", {
  ecosystem_id: serial("ecosystem_id").primaryKey(),
  ecosystem_name: varchar("ecosystem_name", { length: 128 }),
  profession_id: integer("profession_id"),
  brand_id: integer("brand_id"),
});

// Brand lookup table
export const brand_lookup = pgTable("brand_lookup", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }),
  description: varchar("description", { length: 256 }),
  ecosystem_id: integer("ecosystem_id").references(() => ecosystem.ecosystem_id),
});

// Profession lookup table
export const profession_lookup = pgTable("profession_lookup", {
  id: serial("id").primaryKey(),
  offering_id: uuid("offering_id"),
  profession_id: integer("profession_id"),
  name: varchar("name", { length: 128 }),
  description: varchar("description", { length: 256 }),
});

// Fulfillment platform table
export const fulfillment_platform = pgTable("fulfillment_platform", {
  fulfillment_platform_id: serial("fulfillment_platform_id").primaryKey(),
  name: varchar("name", { length: 255 }),
  url: varchar("url", { length: 255 }),
  description_short: varchar("description_short", { length: 256 }),
  description_long: text("description_long"),
  active: boolean("active"),
  create_date: timestamp("create_date"),
});

// State lookup table
export const state_lookup = pgTable("state_lookup", {
  state_id: smallint("state_id").primaryKey(),
  state_name: varchar("state_name", { length: 128 }),
  state_abbr: varchar("state_abbr", { length: 4 }),
  notes: varchar("notes", { length: 512 }),
});

// Cost center lookup table
export const cost_center_lookup = pgTable("cost_center_lookup", {
  id: serial("id").primaryKey(),
  cost_center_name: varchar("cost_center_name", { length: 128 }),
  cost_center_description: varchar("cost_center_description", { length: 256 }),
});

// Main offering table (products)
export const offering = pgTable("offering", {
  offering_id: uuid("offering_id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 128 }),
  sku: varchar("sku", { length: 255 }).notNull(),
  active: boolean("active").default(true),
  description_short: varchar("description_short", { length: 255 }),
  description_long: text("description_long"),
  not_for_sale: boolean("not_for_sale").default(false),
  sequence_order: smallint("sequence_order"),
});

// SKU version table
export const sku_version = pgTable("sku_version", {
  sku_version_id: serial("sku_version_id").primaryKey(),
  offering_id: uuid("offering_id").notNull(),
  version_name: varchar("version_name", { length: 255 }),
});

// SKU version pricing table (enhanced)
export const sku_version_pricing = pgTable("sku_version_pricing", {
  sku_version_pricing_id: serial("sku_version_pricing_id").primaryKey(),
  sku_version_detail_id: integer("sku_version_detail_id"),
  base_price: decimal("base_price", { precision: 10, scale: 2 }),
  cogs: decimal("cogs", { precision: 10, scale: 2 }),
  cost_center: integer("cost_center"),
  delivery_cost: decimal("delivery_cost", { precision: 10, scale: 2 }),
  subscription_price: decimal("subscription_price", { precision: 10, scale: 2 }),
  msrp: decimal("msrp", { precision: 10, scale: 2 }),
  promotional_price: decimal("promotional_price", { precision: 10, scale: 2 }),
  discount_percentage: decimal("discount_percentage", { precision: 5, scale: 2 }),
  recognition_period_months: integer("recognition_period_months"),
  // Enhanced pricing fields from PDF
  revenue_allocation_method: varchar("revenue_allocation_method", { length: 64 }),
  discount_eligibility: varchar("discount_eligibility", { length: 64 }),
  discount_type: varchar("discount_type", { length: 64 }),
  additional_certificate_price: decimal("additional_certificate_price", { precision: 10, scale: 2 }),
  recognition_start_trigger: varchar("recognition_start_trigger", { length: 64 }),
  deferred_revenue_account: varchar("deferred_revenue_account", { length: 64 }),
  income_account: varchar("income_account", { length: 64 }),
  profit_center: varchar("profit_center", { length: 64 }),
  revenue_category: varchar("revenue_category", { length: 64 }),
  revenue_subcategory: varchar("revenue_subcategory", { length: 64 }),
  revenue_forecast_category: varchar("revenue_forecast_category", { length: 64 }),
});

// Offering product table (links offerings to SKU versions)
export const offering_product = pgTable("offering_product", {
  offering_id: uuid("offering_id"),
  sku_version: integer("sku_version"),
});

// Offering brand table (links offerings to brands)
export const offering_brand = pgTable("offering_brand", {
  id: serial("id").primaryKey(),
  offering_id: uuid("offering_id"),
  brand_id: integer("brand_id"),
});

// Offering profession table (links offerings to professions)
export const offering_profession = pgTable("offering_profession", {
  id: serial("id").primaryKey(),
  offering_id: uuid("offering_id"),
  profession_id: integer("profession_id"),
});

// Offering pricing table
export const offering_pricing = pgTable("offering_pricing", {
  offering_pricing_id: serial("offering_pricing_id").primaryKey(),
  offering_id: uuid("offering_id"),
  pricing_override: boolean("pricing_override"),
  pricing_multiplier: boolean("pricing_multiplier"),
  pricing_reduction: boolean("pricing_reduction"),
  override_price: decimal("override_price", { precision: 10, scale: 2 }),
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }),
  reduction_amount: decimal("reduction_amount", { precision: 10, scale: 2 }),
  create_date: timestamp("create_date"),
  created_by: varchar("created_by", { length: 256 }),
});

// SKU version state table
export const sku_version_state = pgTable("sku_version_state", {
  sku_version_state_id: bigint("sku_version_state_id", { mode: "number" }).primaryKey(),
  sku_version_id: integer("sku_version_id"),
  state_id: smallint("state_id"),
});

// Product SKU table (core product information)
export const product_sku = pgTable("product_sku", {
  sku: varchar("sku", { length: 255 }).primaryKey(),
  active: boolean("active").default(true),
  create_date: timestamp("create_date").defaultNow(),
  name: varchar("name", { length: 255 }),
});

// SKU version detail table (enhanced version information)
export const sku_version_detail = pgTable("sku_version_detail", {
  sku_version_detail_id: serial("sku_version_detail_id").primaryKey(),
  sku_version: integer("sku_version"),
  version_name: varchar("version_name", { length: 128 }),
  active: boolean("active").default(true),
  qualifying_education: boolean("qualifying_education").default(false),
  continuing_education: boolean("continuing_education").default(false),
  description_short: varchar("description_short", { length: 256 }),
  description_long: text("description_long"),
  not_for_individual_sale: boolean("not_for_individual_sale").default(false),
  credit_hours: integer("credit_hours"),
  access_period: varchar("access_period", { length: 128 }),
  platform: varchar("platform", { length: 128 }),
  hybrid_delivery: boolean("hybrid_delivery").default(false),
  certifications_awarded: varchar("certifications_awarded", { length: 256 }),
  owner: varchar("owner", { length: 128 }),
});

// Product features lookup
export const product_features = pgTable("product_features", {
  product_feature_id: serial("product_feature_id").primaryKey(),
  feature_name: varchar("feature_name", { length: 128 }),
  feature_description: text("feature_description"),
  active: boolean("active").default(true),
});

// SKU version features (many-to-many relationship)
export const sku_version_features = pgTable("sku_version_features", {
  sku_feature_id: serial("sku_feature_id").primaryKey(),
  sku_version_detail_id: integer("sku_version_detail_id").notNull(),
  feature_id: integer("feature_id").notNull(),
  regulatory_modifier: boolean("regulatory_modifier").default(false),
  pricing_modifier: boolean("pricing_modifier").default(false),
});

// Language lookup
export const language_lookup = pgTable("language_lookup", {
  language_id: smallint("language_id").primaryKey(),
  language_name: varchar("language_name", { length: 64 }),
  language_abbr: varchar("language_abbr", { length: 4 }),
});

// SKU version content
export const sku_version_content = pgTable("sku_version_content", {
  sku_version_content_id: serial("sku_version_content_id").primaryKey(),
  sku_version_detail_id: integer("sku_version_detail_id"),
  content_version: varchar("content_version", { length: 64 }),
  content_format: varchar("content_format", { length: 64 }),
  mobile_compatible: boolean("mobile_compatible").default(false),
  description_short: varchar("description_short", { length: 256 }),
  description_long: text("description_long"),
  content_length: varchar("content_length", { length: 64 }),
  instructor_information: varchar("instructor_information", { length: 256 }),
  refresh_date: timestamp("refresh_date"),
  create_date: timestamp("create_date").defaultNow(),
});

// Content language (multi-language support)
export const content_language = pgTable("content_language", {
  content_language_id: serial("content_language_id").primaryKey(),
  sku_version_content_id: integer("sku_version_content_id"),
  language_id: smallint("language_id"),
});

// SKU version fulfillment platform
export const sku_version_fulfillment_platform = pgTable("sku_version_fulfillment_platform", {
  sku_fulfillment_platform_id: serial("sku_fulfillment_platform_id").primaryKey(),
  sku_version_id: integer("sku_version_id").notNull(),
  fulfillment_platform_id: integer("fulfillment_platform_id").notNull(),
});

// Relations
export const offeringRelations = relations(offering, ({ many, one }) => ({
  offering_brands: many(offering_brand),
  offering_professions: many(offering_profession),
  offering_products: many(offering_product),
  offering_pricing: many(offering_pricing),
  sku_versions: many(sku_version),
}));

export const offering_brandRelations = relations(offering_brand, ({ one }) => ({
  offering: one(offering, {
    fields: [offering_brand.offering_id],
    references: [offering.offering_id],
  }),
  brand: one(brand_lookup, {
    fields: [offering_brand.brand_id],
    references: [brand_lookup.id],
  }),
}));

export const offering_professionRelations = relations(offering_profession, ({ one }) => ({
  offering: one(offering, {
    fields: [offering_profession.offering_id],
    references: [offering.offering_id],
  }),
  profession: one(profession_lookup, {
    fields: [offering_profession.profession_id],
    references: [profession_lookup.id],
  }),
}));

export const offering_productRelations = relations(offering_product, ({ one }) => ({
  offering: one(offering, {
    fields: [offering_product.offering_id],
    references: [offering.offering_id],
  }),
  sku_version: one(sku_version, {
    fields: [offering_product.sku_version],
    references: [sku_version.sku_version_id],
  }),
}));

export const sku_versionRelations = relations(sku_version, ({ many, one }) => ({
  offering: one(offering, {
    fields: [sku_version.offering_id],
    references: [offering.offering_id],
  }),
  offering_products: many(offering_product),
  sku_version_pricing: one(sku_version_pricing, {
    fields: [sku_version.sku_version_id],
    references: [sku_version_pricing.sku_version_detail_id],
  }),
  sku_version_states: many(sku_version_state),
  sku_version_detail: one(sku_version_detail, {
    fields: [sku_version.sku_version_id],
    references: [sku_version_detail.sku_version],
  }),
  sku_version_fulfillment_platforms: many(sku_version_fulfillment_platform),
}));

// Additional relations for new tables
export const product_skuRelations = relations(product_sku, ({ many }) => ({
  offerings: many(offering),
}));

export const sku_version_detailRelations = relations(sku_version_detail, ({ one, many }) => ({
  sku_version: one(sku_version, {
    fields: [sku_version_detail.sku_version],
    references: [sku_version.sku_version_id],
  }),
  sku_version_features: many(sku_version_features),
  sku_version_contents: many(sku_version_content),
  sku_version_pricing: many(sku_version_pricing),
}));

export const product_featuresRelations = relations(product_features, ({ many }) => ({
  sku_version_features: many(sku_version_features),
}));

export const sku_version_featuresRelations = relations(sku_version_features, ({ one }) => ({
  sku_version_detail: one(sku_version_detail, {
    fields: [sku_version_features.sku_version_detail_id],
    references: [sku_version_detail.sku_version_detail_id],
  }),
  feature: one(product_features, {
    fields: [sku_version_features.feature_id],
    references: [product_features.product_feature_id],
  }),
}));

export const language_lookupRelations = relations(language_lookup, ({ many }) => ({
  content_languages: many(content_language),
}));

export const sku_version_contentRelations = relations(sku_version_content, ({ one, many }) => ({
  sku_version_detail: one(sku_version_detail, {
    fields: [sku_version_content.sku_version_detail_id],
    references: [sku_version_detail.sku_version_detail_id],
  }),
  content_languages: many(content_language),
}));

export const content_languageRelations = relations(content_language, ({ one }) => ({
  sku_version_content: one(sku_version_content, {
    fields: [content_language.sku_version_content_id],
    references: [sku_version_content.sku_version_content_id],
  }),
  language: one(language_lookup, {
    fields: [content_language.language_id],
    references: [language_lookup.language_id],
  }),
}));

export const sku_version_fulfillment_platformRelations = relations(sku_version_fulfillment_platform, ({ one }) => ({
  sku_version: one(sku_version, {
    fields: [sku_version_fulfillment_platform.sku_version_id],
    references: [sku_version.sku_version_id],
  }),
  fulfillment_platform: one(fulfillment_platform, {
    fields: [sku_version_fulfillment_platform.fulfillment_platform_id],
    references: [fulfillment_platform.fulfillment_platform_id],
  }),
}));

export const sku_version_pricingRelations = relations(sku_version_pricing, ({ one }) => ({
  sku_version: one(sku_version, {
    fields: [sku_version_pricing.sku_version_detail_id],
    references: [sku_version.sku_version_id],
  }),
  cost_center: one(cost_center_lookup, {
    fields: [sku_version_pricing.cost_center],
    references: [cost_center_lookup.id],
  }),
}));

// Insert schemas
export const insertOfferingSchema = createInsertSchema(offering);
export const insertSkuVersionSchema = createInsertSchema(sku_version);
export const insertSkuVersionPricingSchema = createInsertSchema(sku_version_pricing);
export const insertBrandLookupSchema = createInsertSchema(brand_lookup);
export const insertEcosystemSchema = createInsertSchema(ecosystem);
export const insertOfferingBrandSchema = createInsertSchema(offering_brand);
export const insertFulfillmentPlatformSchema = createInsertSchema(fulfillment_platform);

// Enhanced product form schema with full business rules
export const productFormSchema = z.object({
  // Basic product information
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  ecosystem_id: z.number().min(1, "Ecosystem is required").optional(),
  brand_id: z.number().min(1, "Brand is required"),
  description_short: z.string().optional(),
  description_long: z.string().optional(),
  sequence_order: z.number().min(0).max(255).optional(),
  product_status: z.enum(["active", "not_for_sale"]).default("active"),
  
  // Version details
  version_name: z.string().min(1, "Version name is required"),
  qualifying_education: z.boolean().default(false),
  continuing_education: z.boolean().default(false),
  not_for_individual_sale: z.boolean().default(false),
  credit_hours: z.number().min(0).optional(),
  access_period: z.string().optional(),
  platform: z.string().optional(),
  hybrid_delivery: z.boolean().default(false),
  certifications_awarded: z.string().optional(),
  owner: z.string().optional(),
  
  // Pricing information
  base_price: z.number().min(0, "Base price must be positive"),
  msrp: z.number().min(0).optional(),
  cogs: z.number().min(0).optional(),
  delivery_cost: z.number().min(0).optional(),
  subscription_price: z.number().min(0).optional(),
  promotional_price: z.number().min(0).optional(),
  discount_percentage: z.number().min(0).max(100).optional(),
  recognition_period_months: z.number().min(0).optional(),
  additional_certificate_price: z.number().min(0).optional(),
  
  // Advanced pricing
  revenue_allocation_method: z.string().optional(),
  discount_eligibility: z.string().optional(),
  discount_type: z.string().optional(),
  recognition_start_trigger: z.string().optional(),
  
  // Content information
  content_format: z.string().optional(),
  mobile_compatible: z.boolean().default(false),
  content_length: z.string().optional(),
  instructor_information: z.string().optional(),
  
  // Fulfillment
  fulfillment_platform_ids: z.array(z.number()).default([]),
  
  // Features
  feature_ids: z.array(z.number()).default([]),
});

// Version form schema for adding versions to existing products
export const versionFormSchema = z.object({
  version_name: z.string().min(1, "Version name is required"),
  qualifying_education: z.boolean().default(false),
  continuing_education: z.boolean().default(false),
  not_for_individual_sale: z.boolean().default(false),
  credit_hours: z.number().min(0).optional(),
  access_period: z.string().optional(),
  platform: z.string().optional(),
  hybrid_delivery: z.boolean().default(false),
  certifications_awarded: z.string().optional(),
  owner: z.string().optional(),
  base_price: z.number().min(0, "Base price must be positive"),
  msrp: z.number().min(0).optional(),
  cogs: z.number().min(0).optional(),
  content_format: z.string().optional(),
  mobile_compatible: z.boolean().default(false),
  content_length: z.string().optional(),
  instructor_information: z.string().optional(),
  fulfillment_platform_ids: z.array(z.number()).default([]),
  feature_ids: z.array(z.number()).default([]),
});

// Types
export type InsertOffering = z.infer<typeof insertOfferingSchema>;
export type Offering = typeof offering.$inferSelect;
export type InsertSkuVersion = z.infer<typeof insertSkuVersionSchema>;
export type SkuVersion = typeof sku_version.$inferSelect;
export type InsertSkuVersionPricing = z.infer<typeof insertSkuVersionPricingSchema>;
export type SkuVersionPricing = typeof sku_version_pricing.$inferSelect;
export type BrandLookup = typeof brand_lookup.$inferSelect;
export type Ecosystem = typeof ecosystem.$inferSelect;
export type FulfillmentPlatform = typeof fulfillment_platform.$inferSelect;
export type ProductFormData = z.infer<typeof productFormSchema>;
export type VersionFormData = z.infer<typeof versionFormSchema>;
export type ProductFeature = typeof product_features.$inferSelect;
export type LanguageLookup = typeof language_lookup.$inferSelect;
export type SkuVersionDetail = typeof sku_version_detail.$inferSelect;
export type SkuVersionContent = typeof sku_version_content.$inferSelect;

// Enhanced product with full relations
export type ProductWithRelations = Offering & {
  offering_brands: (typeof offering_brand.$inferSelect & {
    brand: BrandLookup | null;
  })[];
  offering_products: (typeof offering_product.$inferSelect)[];
  sku_versions: (SkuVersion & {
    sku_version_detail: (typeof sku_version_detail.$inferSelect & {
      sku_version_pricing: SkuVersionPricing[];
      sku_version_features: (typeof sku_version_features.$inferSelect & {
        feature: typeof product_features.$inferSelect;
      })[];
      sku_version_contents: (typeof sku_version_content.$inferSelect & {
        content_languages: (typeof content_language.$inferSelect & {
          language: typeof language_lookup.$inferSelect;
        })[];
      })[];
    }) | null;
    sku_version_fulfillment_platforms: (typeof sku_version_fulfillment_platform.$inferSelect & {
      fulfillment_platform: FulfillmentPlatform;
    })[];
  })[];
};

// Keep existing user schema for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
