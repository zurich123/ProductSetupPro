import { pgTable, text, serial, integer, boolean, decimal, uuid, varchar, tinyint, bigint, timestamp } from "drizzle-orm/pg-core";
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
  state_id: tinyint("state_id").primaryKey(),
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
  active: boolean("active").default(true),
  description_short: varchar("description_short", { length: 255 }),
  description_long: text("description_long"),
  not_for_sale: boolean("not_for_sale").default(false),
  sequence_order: tinyint("sequence_order"),
});

// SKU version table
export const sku_version = pgTable("sku_version", {
  sku_version_id: serial("sku_version_id").primaryKey(),
  sku: varchar("sku", { length: 255 }),
  version_name: varchar("version_name", { length: 255 }),
});

// SKU version pricing table
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
  discount_percentage: decimal("discount_percentage", { precision: 3, scale: 2 }),
  recognition_period_months: integer("recognition_period_months"),
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
  state_id: tinyint("state_id"),
});

// Relations
export const offeringRelations = relations(offering, ({ many, one }) => ({
  offering_brands: many(offering_brand),
  offering_professions: many(offering_profession),
  offering_products: many(offering_product),
  offering_pricing: many(offering_pricing),
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
  offering_products: many(offering_product),
  sku_version_pricing: one(sku_version_pricing, {
    fields: [sku_version.sku_version_id],
    references: [sku_version_pricing.sku_version_detail_id],
  }),
  sku_version_states: many(sku_version_state),
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

// Product form schema (combined data for creating products)
export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  ecosystem_id: z.number().min(1, "Ecosystem is required"),
  brand_id: z.number().min(1, "Brand is required"),
  description_short: z.string().optional(),
  description_long: z.string().optional(),
  base_price: z.number().min(0, "Base price must be positive"),
  msrp: z.number().min(0).optional(),
  cogs: z.number().min(0).optional(),
  fulfillment_platform_id: z.number().optional(),
  sequence_order: z.number().min(0).max(255).optional(),
  active: z.boolean().default(true),
  not_for_sale: z.boolean().default(false),
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

// Product with relations type for display
export type ProductWithRelations = Offering & {
  offering_brands: (typeof offering_brand.$inferSelect & {
    brand: BrandLookup | null;
  })[];
  offering_products: (typeof offering_product.$inferSelect & {
    sku_version: SkuVersion & {
      sku_version_pricing: SkuVersionPricing | null;
    } | null;
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
