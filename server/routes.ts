import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { productFormSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all products with optional filters
  app.get("/api/products", async (req, res) => {
    try {
      const search = req.query.search as string | undefined;
      const ecosystem_id = req.query.ecosystem_id ? parseInt(req.query.ecosystem_id as string) : undefined;
      const brand_id = req.query.brand_id ? parseInt(req.query.brand_id as string) : undefined;
      
      const products = await storage.getProducts(search, ecosystem_id, brand_id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get product by ID
  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Create new product
  app.post("/api/products", async (req, res) => {
    try {
      const productData = productFormSchema.parse(req.body);
      
      // Auto-derive ecosystem from brand if not provided
      if (!productData.ecosystem_id && productData.brand_id) {
        const brands = await storage.getBrands();
        const selectedBrand = brands.find(b => b.id === productData.brand_id);
        if (selectedBrand?.ecosystem_id) {
          productData.ecosystem_id = selectedBrand.ecosystem_id;
        }
      }
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  // Update product
  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedData = productFormSchema.parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Clone product
  app.post("/api/products/:id/clone", async (req, res) => {
    try {
      const clonedProduct = await storage.cloneProduct(req.params.id);
      res.status(201).json(clonedProduct);
    } catch (error) {
      console.error("Error cloning product:", error);
      res.status(500).json({ message: "Failed to clone product" });
    }
  });

  // Get lookup data
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getBrands();
      res.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({ message: "Failed to fetch brands" });
    }
  });

  app.get("/api/ecosystems", async (req, res) => {
    try {
      const ecosystems = await storage.getEcosystems();
      res.json(ecosystems);
    } catch (error) {
      console.error("Error fetching ecosystems:", error);
      res.status(500).json({ message: "Failed to fetch ecosystems" });
    }
  });

  app.get("/api/fulfillment-platforms", async (req, res) => {
    try {
      const platforms = await storage.getFulfillmentPlatforms();
      res.json(platforms);
    } catch (error) {
      console.error("Error fetching fulfillment platforms:", error);
      res.status(500).json({ message: "Failed to fetch fulfillment platforms" });
    }
  });

  app.get("/api/product-features", async (req, res) => {
    try {
      const features = await storage.getProductFeatures();
      res.json(features);
    } catch (error) {
      console.error("Error fetching product features:", error);
      res.status(500).json({ message: "Failed to fetch product features" });
    }
  });

  app.get("/api/languages", async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
