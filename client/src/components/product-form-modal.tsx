import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { productFormSchema, type ProductFormData, type ProductWithRelations, type BrandLookup, type Ecosystem } from "@shared/schema";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductWithRelations | null;
  brands: BrandLookup[];
  ecosystems: Ecosystem[];
}

export function ProductFormModal({ 
  isOpen, 
  onClose, 
  editingProduct, 
  brands, 
  ecosystems 
}: ProductFormModalProps) {
  const { toast } = useToast();
  const isEditing = !!editingProduct;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      ecosystem_id: 0,
      brand_id: 0,
      description_short: "",
      description_long: "",
      base_price: 0,
      version_name: "Standard",
      product_status: "draft" as const,
      credit_hours: 0,
      continuing_education: false,
      qualifying_education: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      console.log("Submitting product data:", data);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("API Error:", response.status, errorData);
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Product created successfully:", data);
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Product creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      return apiRequest(`/api/products/${editingProduct!.offering_id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onClose();
    },
    onError: (error) => {
      console.error("Product update error:", error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        // Populate form with existing product data
        const brandId = editingProduct.offering_brands[0]?.brand_id;
        const versionDetail = editingProduct.sku_versions[0]?.sku_version_detail;
        const pricing = versionDetail?.sku_version_pricing[0];
        
        form.reset({
          name: editingProduct.name || "",
          sku: editingProduct.sku || "",
          brand_id: brandId || 0,
          ecosystem_id: 0,
          description_short: editingProduct.description_short || "",
          description_long: editingProduct.description_long || "",
          base_price: pricing?.base_price ? parseFloat(pricing.base_price.toString()) : 0,
          version_name: versionDetail?.version_name || "Standard",
          product_status: editingProduct.active ? "active" : "inactive",
          credit_hours: versionDetail?.credit_hours || 0,
          continuing_education: versionDetail?.continuing_education || false,
          qualifying_education: versionDetail?.qualifying_education || false,
          access_period: versionDetail?.access_period || "",
          platform: versionDetail?.platform || "",
          owner: versionDetail?.owner || "",
        });
      } else {
        form.reset({
          name: "",
          sku: "",
          ecosystem_id: 0,
          brand_id: 0,
          description_short: "",
          description_long: "",
          base_price: 0,
          version_name: "Standard",
          product_status: "draft" as const,
          credit_hours: 0,
          continuing_education: false,
          qualifying_education: false,
          access_period: "",
          platform: "",
          owner: "",
        });
      }
    }
  }, [isOpen, editingProduct, form]);

  const onSubmit = (data: ProductFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Card - Simplified Layout */}
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Product Name
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* SKU */}
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          SKU
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter SKU" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Brand */}
                  <FormField
                    control={form.control}
                    name="brand_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Brand
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="text-sm text-gray-600 mb-2">
                          Ecosystem will be automatically selected based on brand
                        </div>
                        <Select 
                          onValueChange={(value) => {
                            const brandId = parseInt(value);
                            field.onChange(brandId);
                            
                            // Auto-select ecosystem based on brand
                            const selectedBrand = brands.find(b => b.id === brandId);
                            if (selectedBrand?.ecosystem_id) {
                              form.setValue('ecosystem_id', selectedBrand.ecosystem_id);
                            } else if (ecosystems.length > 0) {
                              form.setValue('ecosystem_id', ecosystems[0].ecosystem_id);
                            }
                          }} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id.toString()}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Base Price */}
                  <FormField
                    control={form.control}
                    name="base_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Base Price
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="pl-8"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Short */}
                  <FormField
                    control={form.control}
                    name="description_short"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief product description" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Credit Hours */}
                  <FormField
                    control={form.control}
                    name="credit_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          Credit Hours
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter credit hours" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Version Name */}
                  <FormField
                    control={form.control}
                    name="version_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Standard, Premium" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Long */}
                  <FormField
                    control={form.control}
                    name="description_long"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Detailed Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed product description"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Education Type */}
                  <div className="grid grid-cols-2 gap-4 md:col-span-2">
                    <FormField
                      control={form.control}
                      name="continuing_education"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Continuing Education
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="qualifying_education"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Qualifying Education
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}