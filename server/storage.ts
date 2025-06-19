import { 
  offering, 
  sku_version, 
  sku_version_pricing, 
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
    const query = db
      .select()
      .from(offering)
      .leftJoin(offering_brand, eq(offering.offering_id, offering_brand.offering_id))
      .leftJoin(brand_lookup, eq(offering_brand.brand_id, brand_lookup.id))
      .leftJoin(offering_product, eq(offering.offering_id, offering_product.offering_id))
      .leftJoin(sku_version, eq(offering.offering_id, sku_version.offering_id))
      .leftJoin(sku_version_pricing, eq(sku_version.sku_version_id, sku_version_pricing.sku_version_detail_id));

    const results = await query;
    
    // Group by offering_id and transform to ProductWithRelations
    const productsMap = new Map<string, ProductWithRelations>();
    
    for (const row of results) {
      const product = row.offering;
      if (!product) continue;
      
      if (!productsMap.has(product.offering_id)) {
        productsMap.set(product.offering_id, {
          ...product,
          offering_brands: [],
          offering_products: []
        });
      }
      
      const productWithRelations = productsMap.get(product.offering_id)!;
      
      // Add brand relation if exists and not already added
      if (row.offering_brand && row.brand_lookup) {
        const existingBrand = productWithRelations.offering_brands.find(
          b => b.brand_id === row.offering_brand!.brand_id
        );
        if (!existingBrand) {
          productWithRelations.offering_brands.push({
            ...row.offering_brand,
            brand: row.brand_lookup
          });
        }
      }
      
      // Add product relation if exists and not already added
      if (row.offering_product && row.sku_version) {
        const existingProduct = productWithRelations.offering_products.find(
          p => p.sku_version === row.offering_product!.sku_version
        );
        if (!existingProduct) {
          productWithRelations.offering_products.push({
            offering_id: row.offering_product.offering_id,
            sku_version: row.offering_product.sku_version
          });
        }
      }
    }
    
    return Array.from(productsMap.values());
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
          active: productData.active,
          not_for_sale: productData.not_for_sale,
          sequence_order: productData.sequence_order,
        })
        .returning();

      // Create SKU version
      const [newSkuVersion] = await tx
        .insert(sku_version)
        .values({
          offering_id: newOffering.offering_id,
          version_name: `v1.0`
        })
        .returning();

      // Create SKU version pricing
      await tx
        .insert(sku_version_pricing)
        .values({
          sku_version_detail_id: newSkuVersion.sku_version_id,
          base_price: productData.base_price.toString(),
          msrp: productData.msrp?.toString(),
          cogs: productData.cogs?.toString(),
        });

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

      // Return the created product with relations
      const createdProduct = await this.getProductById(newOffering.offering_id);
      if (!createdProduct) {
        throw new Error("Failed to retrieve created product");
      }
      
      return createdProduct;
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
          active: productData.active,
          not_for_sale: productData.not_for_sale,
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
    const originalPricing = originalProduct.sku_versions[0]?.sku_version_pricing;
    const originalBrand = originalProduct.offering_brands[0]?.brand_id;

    const cloneData: ProductFormData = {
      name: `${originalProduct.name} (Copy)`,
      sku: `${originalSku}-COPY`,
      ecosystem_id: 1, // Default ecosystem
      brand_id: originalBrand || 1,
      description_short: originalProduct.description_short || undefined,
      description_long: originalProduct.description_long || undefined,
      base_price: originalPricing?.base_price ? parseFloat(originalPricing.base_price) : 0,
      msrp: originalPricing?.msrp ? parseFloat(originalPricing.msrp) : undefined,
      cogs: originalPricing?.cogs ? parseFloat(originalPricing.cogs) : undefined,
      fulfillment_platform_id: undefined,
      sequence_order: originalProduct.sequence_order || undefined,
      active: false, // Clone as inactive by default
      not_for_sale: originalProduct.not_for_sale || false,
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
}

export const storage = new DatabaseStorage();
