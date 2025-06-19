import { 
  offering, 
  sku_version, 
  sku_version_pricing, 
  sku_version_detail,
  sku_version_content,
  sku_version_features,
  sku_version_fulfillment_platform,
  product_features,
  language_lookup,
  content_language,
  offering_product, 
  offering_brand, 
  brand_lookup, 
  ecosystem, 
  fulfillment_platform,
  type Offering, 
  type InsertOffering,
  type ProductWithRelations,
  type ProductFormData,
  type BrandLookup,
  type Ecosystem,
  type FulfillmentPlatform,
  type ProductFeature,
  type LanguageLookup,
  type User,
  type InsertUser,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, and, or } from "drizzle-orm";

export interface IStorage {
  // User methods (existing)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProducts(search?: string, ecosystem_id?: number, brand_id?: number): Promise<ProductWithRelations[]>;
  getProductById(id: string): Promise<ProductWithRelations | undefined>;
  createProduct(productData: ProductFormData): Promise<ProductWithRelations>;
  updateProduct(id: string, productData: ProductFormData): Promise<ProductWithRelations>;
  deleteProduct(id: string): Promise<void>;
  cloneProduct(id: string): Promise<ProductWithRelations>;
  
  // Lookup data methods
  getBrands(): Promise<BrandLookup[]>;
  getEcosystems(): Promise<Ecosystem[]>;
  getFulfillmentPlatforms(): Promise<FulfillmentPlatform[]>;
  getProductFeatures(): Promise<ProductFeature[]>;
  getLanguages(): Promise<LanguageLookup[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(search?: string, ecosystem_id?: number, brand_id?: number): Promise<ProductWithRelations[]> {
    // Get basic offering data with brands
    const offerings = await db
      .select()
      .from(offering)
      .leftJoin(offering_brand, eq(offering.offering_id, offering_brand.offering_id))
      .leftJoin(brand_lookup, eq(offering_brand.brand_id, brand_lookup.id))
      .leftJoin(offering_product, eq(offering.offering_id, offering_product.offering_id));

    const resultMap = new Map<string, ProductWithRelations>();

    // Process basic offering data
    for (const row of offerings) {
      const productId = row.offering.offering_id;
      
      if (!resultMap.has(productId)) {
        resultMap.set(productId, {
          ...row.offering,
          offering_brands: [],
          offering_products: [],
          sku_versions: [],
        });
      }

      const product = resultMap.get(productId)!;

      // Add offering_brand if not already present
      if (row.offering_brand && !product.offering_brands.some(ob => ob.id === row.offering_brand?.id)) {
        product.offering_brands.push({
          ...row.offering_brand,
          brand: row.brand_lookup,
        });
      }

      // Add offering_product if not already present
      if (row.offering_product && !product.offering_products.some(op => op.offering_id === row.offering_product?.offering_id)) {
        product.offering_products.push(row.offering_product);
      }
    }

    // Get SKU versions with details for each product
    for (const productId of Array.from(resultMap.keys())) {
      const product = resultMap.get(productId)!;
      const versions = await db
        .select()
        .from(sku_version)
        .leftJoin(sku_version_detail, eq(sku_version.sku_version_id, sku_version_detail.sku_version))
        .leftJoin(sku_version_pricing, eq(sku_version_detail.sku_version_detail_id, sku_version_pricing.sku_version_detail_id))
        .leftJoin(sku_version_fulfillment_platform, eq(sku_version.sku_version_id, sku_version_fulfillment_platform.sku_version_id))
        .leftJoin(fulfillment_platform, eq(sku_version_fulfillment_platform.fulfillment_platform_id, fulfillment_platform.fulfillment_platform_id))
        .where(eq(sku_version.offering_id, productId));

      for (const versionRow of versions) {
        if (versionRow.sku_version && !product.sku_versions.some((sv: any) => sv.sku_version_id === versionRow.sku_version?.sku_version_id)) {
          // Get features for this version detail
          const features = versionRow.sku_version_detail ? await db
            .select()
            .from(sku_version_features)
            .leftJoin(product_features, eq(sku_version_features.feature_id, product_features.product_feature_id))
            .where(eq(sku_version_features.sku_version_detail_id, versionRow.sku_version_detail.sku_version_detail_id)) : [];

          // Get content for this version detail
          const contents = versionRow.sku_version_detail ? await db
            .select()
            .from(sku_version_content)
            .where(eq(sku_version_content.sku_version_detail_id, versionRow.sku_version_detail.sku_version_detail_id)) : [];

          product.sku_versions.push({
            ...versionRow.sku_version,
            sku_version_detail: versionRow.sku_version_detail ? {
              ...versionRow.sku_version_detail,
              sku_version_pricing: versionRow.sku_version_pricing ? [versionRow.sku_version_pricing] : [],
              sku_version_features: features.map(f => ({
                ...f.sku_version_features!,
                feature: f.product_features!,
              })),
              sku_version_contents: contents.map(c => ({
                ...c,
                content_languages: [],
              })),
            } : null,
            sku_version_fulfillment_platforms: versionRow.sku_version_fulfillment_platform && versionRow.fulfillment_platform ? [{
              ...versionRow.sku_version_fulfillment_platform,
              fulfillment_platform: versionRow.fulfillment_platform,
            }] : [],
          });
        }
      }
    }

    return Array.from(resultMap.values());
  }

  async getProductById(id: string): Promise<ProductWithRelations | undefined> {
    const products = await this.getProducts();
    return products.find(p => p.offering_id === id);
  }

  async createProduct(productData: ProductFormData): Promise<ProductWithRelations> {
    return await db.transaction(async (tx) => {
      // Create offering
      const [newOffering] = await tx
        .insert(offering)
        .values({
          name: productData.name,
          sku: productData.sku,
          description_short: productData.description_short,
          description_long: productData.description_long,
          active: productData.product_status === "active",
          not_for_sale: productData.product_status === "inactive",
          sequence_order: productData.sequence_order,
        })
        .returning();

      // Create SKU version
      const [newSkuVersion] = await tx
        .insert(sku_version)
        .values({
          offering_id: newOffering.offering_id,
          version_name: productData.version_name || "v1.0"
        })
        .returning();

      // Create SKU version detail
      const [newSkuVersionDetail] = await tx
        .insert(sku_version_detail)
        .values({
          sku_version: newSkuVersion.sku_version_id,
          version_name: productData.version_name || "v1.0",
          active: true,
          qualifying_education: productData.qualifying_education,
          continuing_education: productData.continuing_education,
          description_short: productData.description_short,
          description_long: productData.description_long,
          not_for_individual_sale: productData.not_for_individual_sale,
          credit_hours: productData.credit_hours,
          access_period: productData.access_period,
          platform: productData.platform,
          hybrid_delivery: productData.hybrid_delivery,
          certifications_awarded: productData.certifications_awarded,
          owner: productData.owner,
        })
        .returning();

      // Create SKU version pricing
      await tx
        .insert(sku_version_pricing)
        .values({
          sku_version_detail_id: newSkuVersionDetail.sku_version_detail_id,
          base_price: productData.base_price.toString(),
          msrp: productData.msrp?.toString(),
          cogs: productData.cogs?.toString(),
          delivery_cost: productData.delivery_cost?.toString(),
          subscription_price: productData.subscription_price?.toString(),
          promotional_price: productData.promotional_price?.toString(),
          discount_percentage: productData.discount_percentage?.toString(),
          recognition_period_months: productData.recognition_period_months,
          additional_certificate_price: productData.additional_certificate_price?.toString(),
          revenue_allocation_method: productData.revenue_allocation_method,
          discount_eligibility: productData.discount_eligibility,
          discount_type: productData.discount_type,
          recognition_start_trigger: productData.recognition_start_trigger,
        });

      // Create content if provided
      if (productData.content_format || productData.instructor_information) {
        const [newContent] = await tx
          .insert(sku_version_content)
          .values({
            sku_version_detail_id: newSkuVersionDetail.sku_version_detail_id,
            content_format: productData.content_format,
            mobile_compatible: productData.mobile_compatible,
            description_short: productData.description_short,
            description_long: productData.description_long,
            content_length: productData.content_length,
            instructor_information: productData.instructor_information,
          })
          .returning();
      }

      // Link features
      if (productData.feature_ids && productData.feature_ids.length > 0) {
        for (const featureId of productData.feature_ids) {
          await tx.insert(sku_version_features).values({
            sku_version_detail_id: newSkuVersionDetail.sku_version_detail_id,
            feature_id: featureId,
            regulatory_modifier: false,
            pricing_modifier: false,
          });
        }
      }

      // Link fulfillment platforms
      if (productData.fulfillment_platform_ids && productData.fulfillment_platform_ids.length > 0) {
        for (const platformId of productData.fulfillment_platform_ids) {
          await tx.insert(sku_version_fulfillment_platform).values({
            sku_version_id: newSkuVersion.sku_version_id,
            fulfillment_platform_id: platformId,
          });
        }
      }

      // Link offering to SKU version
      await tx
        .insert(offering_product)
        .values({
          offering_id: newOffering.offering_id,
          sku_version: newSkuVersion.sku_version_id,
        });

      // Link offering to brand
      await tx
        .insert(offering_brand)
        .values({
          offering_id: newOffering.offering_id,
          brand_id: productData.brand_id,
        });

      // Return the created product by constructing it directly
      return {
        ...newOffering,
        offering_brands: [{
          id: 0,
          offering_id: newOffering.offering_id,
          brand_id: productData.brand_id,
          brand: null,
        }],
        offering_products: [{
          offering_id: newOffering.offering_id,
          sku_version: newSkuVersion.sku_version_id,
        }],
        sku_versions: [{
          ...newSkuVersion,
          sku_version_detail: {
            ...newSkuVersionDetail,
            sku_version_pricing: [],
            sku_version_features: [],
            sku_version_contents: [],
          },
          sku_version_fulfillment_platforms: [],
        }],
      };
    });
  }

  async updateProduct(id: string, productData: ProductFormData): Promise<ProductWithRelations> {
    return await db.transaction(async (tx) => {
      // Update offering
      await tx
        .update(offering)
        .set({
          name: productData.name,
          sku: productData.sku,
          description_short: productData.description_short,
          description_long: productData.description_long,
          active: productData.product_status === "active",
          not_for_sale: productData.product_status === "inactive",
          sequence_order: productData.sequence_order,
        })
        .where(eq(offering.offering_id, id));

      // Get the existing product to update related records
      const existingProduct = await this.getProductById(id);
      if (!existingProduct) {
        throw new Error("Product not found");
      }

      // Update SKU versions pricing (first version only for now)
      if (existingProduct.sku_versions.length > 0) {
        const skuVersionId = existingProduct.sku_versions[0].sku_version_id;
        
        // Update pricing
        await tx
          .update(sku_version_pricing)
          .set({
            base_price: productData.base_price.toString(),
            msrp: productData.msrp?.toString(),
            cogs: productData.cogs?.toString(),
          })
          .where(eq(sku_version_pricing.sku_version_detail_id, skuVersionId));
      }

      // Update brand relationship
      if (existingProduct && existingProduct.offering_brands.length > 0) {
        await tx
          .update(offering_brand)
          .set({
            brand_id: productData.brand_id,
          })
          .where(eq(offering_brand.offering_id, id));
      }

      // Return updated product
      const updatedProduct = await this.getProductById(id);
      if (!updatedProduct) {
        throw new Error("Failed to retrieve updated product");
      }
      
      return updatedProduct;
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get product to find related records
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error("Product not found");
      }

      // Delete in correct order due to foreign key constraints
      
      // Delete SKU version pricing
      for (const version of product.sku_versions) {
        await tx
          .delete(sku_version_pricing)
          .where(eq(sku_version_pricing.sku_version_detail_id, version.sku_version_id));
      }

      // Delete offering products
      await tx
        .delete(offering_product)
        .where(eq(offering_product.offering_id, id));

      // Delete SKU versions
      await tx
        .delete(sku_version)
        .where(eq(sku_version.offering_id, id));

      // Delete offering brands
      await tx
        .delete(offering_brand)
        .where(eq(offering_brand.offering_id, id));

      // Finally delete the offering
      await tx
        .delete(offering)
        .where(eq(offering.offering_id, id));
    });
  }

  async cloneProduct(id: string): Promise<ProductWithRelations> {
    const originalProduct = await this.getProductById(id);
    if (!originalProduct) {
      throw new Error("Product not found");
    }

    // Get the original product data to create a clone
    const originalSku = originalProduct.sku;
    const versionDetail = originalProduct.sku_versions[0]?.sku_version_detail;
    const originalPricing = versionDetail?.sku_version_pricing[0];
    const originalBrand = originalProduct.offering_brands[0]?.brand_id;

    const cloneData: ProductFormData = {
      name: `${originalProduct.name} (Copy)`,
      sku: `${originalSku}-COPY`,
      ecosystem_id: 1, // Default ecosystem
      brand_id: originalBrand || 1,
      description_short: originalProduct.description_short || undefined,
      description_long: originalProduct.description_long || undefined,
      version_name: versionDetail?.version_name || "Standard",
      qualifying_education: versionDetail?.qualifying_education || false,
      continuing_education: versionDetail?.continuing_education || false,
      not_for_individual_sale: versionDetail?.not_for_individual_sale || false,
      credit_hours: versionDetail?.credit_hours || undefined,
      access_period: versionDetail?.access_period || undefined,
      platform: versionDetail?.platform || undefined,
      hybrid_delivery: versionDetail?.hybrid_delivery || false,
      certifications_awarded: versionDetail?.certifications_awarded || undefined,
      owner: versionDetail?.owner || undefined,
      base_price: originalPricing?.base_price ? parseFloat(originalPricing.base_price) : 0,
      msrp: originalPricing?.msrp ? parseFloat(originalPricing.msrp) : undefined,
      cogs: originalPricing?.cogs ? parseFloat(originalPricing.cogs) : undefined,
      delivery_cost: originalPricing?.delivery_cost ? parseFloat(originalPricing.delivery_cost) : undefined,
      subscription_price: originalPricing?.subscription_price ? parseFloat(originalPricing.subscription_price) : undefined,
      promotional_price: originalPricing?.promotional_price ? parseFloat(originalPricing.promotional_price) : undefined,
      discount_percentage: originalPricing?.discount_percentage ? parseFloat(originalPricing.discount_percentage) : undefined,
      recognition_period_months: originalPricing?.recognition_period_months || undefined,
      additional_certificate_price: originalPricing?.additional_certificate_price ? parseFloat(originalPricing.additional_certificate_price) : undefined,
      revenue_allocation_method: originalPricing?.revenue_allocation_method || undefined,
      discount_eligibility: originalPricing?.discount_eligibility || undefined,
      discount_type: originalPricing?.discount_type || undefined,
      recognition_start_trigger: originalPricing?.recognition_start_trigger || undefined,
      content_format: versionDetail?.sku_version_contents[0]?.content_format || undefined,
      mobile_compatible: versionDetail?.sku_version_contents[0]?.mobile_compatible || false,
      content_length: versionDetail?.sku_version_contents[0]?.content_length || undefined,
      instructor_information: versionDetail?.sku_version_contents[0]?.instructor_information || undefined,
      fulfillment_platform_ids: [],
      feature_ids: [],
      sequence_order: originalProduct.sequence_order || undefined,
      product_status: originalProduct.active ? "active" : (originalProduct.not_for_sale ? "inactive" : "draft"),
    };

    return await this.createProduct(cloneData);
  }

  async getBrands(): Promise<BrandLookup[]> {
    return await db.select().from(brand_lookup);
  }

  async getEcosystems(): Promise<Ecosystem[]> {
    return await db.select().from(ecosystem);
  }

  async getFulfillmentPlatforms(): Promise<FulfillmentPlatform[]> {
    return await db.select().from(fulfillment_platform);
  }

  async getProductFeatures(): Promise<ProductFeature[]> {
    return await db.select().from(product_features);
  }

  async getLanguages(): Promise<LanguageLookup[]> {
    return await db.select().from(language_lookup);
  }
}

export const storage = new DatabaseStorage();
