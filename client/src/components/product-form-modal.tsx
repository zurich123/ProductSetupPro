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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { productFormSchema, type ProductFormData, type ProductWithRelations, type BrandLookup, type Ecosystem, type FulfillmentPlatform, type ProductFeature } from "@shared/schema";

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

  // Fetch additional lookup data
  const { data: fulfillmentPlatforms = [] } = useQuery<FulfillmentPlatform[]>({
    queryKey: ["/api/fulfillment-platforms"],
  });

  const { data: productFeatures = [] } = useQuery<ProductFeature[]>({
    queryKey: ["/api/product-features"],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      sku: "",
      ecosystem_id: 0,
      brand_id: 0,
      description_short: "",
      description_long: "",
      version_name: "Standard",
      qualifying_education: false,
      continuing_education: false,
      not_for_individual_sale: false,
      credit_hours: undefined,
      access_period: "",
      platform: "",
      hybrid_delivery: false,
      certifications_awarded: "",
      owner: "",
      base_price: undefined,
      msrp: undefined,
      cogs: undefined,
      delivery_cost: undefined,
      subscription_price: undefined,
      promotional_price: undefined,
      discount_percentage: undefined,
      recognition_period_months: undefined,
      additional_certificate_price: undefined,
      revenue_allocation_method: "",
      discount_eligibility: "",
      discount_type: "",
      recognition_start_trigger: "",
      content_format: "",
      mobile_compatible: false,
      content_length: "",
      instructor_information: "",
      fulfillment_platform_ids: [],
      feature_ids: [],
      sequence_order: 0,
      product_status: "active" as const,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await apiRequest("PUT", `/api/products/${editingProduct!.offering_id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onClose();
    },
    onError: (error) => {
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
          ecosystem_id: 1, // Default for now
          brand_id: brandId || 0,
          description_short: editingProduct.description_short || "",
          description_long: editingProduct.description_long || "",
          version_name: versionDetail?.version_name || "Standard",
          qualifying_education: versionDetail?.qualifying_education || false,
          continuing_education: versionDetail?.continuing_education || false,
          not_for_individual_sale: versionDetail?.not_for_individual_sale || false,
          credit_hours: versionDetail?.credit_hours || undefined,
          access_period: versionDetail?.access_period || "",
          platform: versionDetail?.platform || "",
          hybrid_delivery: versionDetail?.hybrid_delivery || false,
          certifications_awarded: versionDetail?.certifications_awarded || "",
          owner: versionDetail?.owner || "",
          base_price: pricing?.base_price ? parseFloat(pricing.base_price) : 0,
          msrp: pricing?.msrp ? parseFloat(pricing.msrp) : undefined,
          cogs: pricing?.cogs ? parseFloat(pricing.cogs) : undefined,
          delivery_cost: pricing?.delivery_cost ? parseFloat(pricing.delivery_cost) : undefined,
          subscription_price: pricing?.subscription_price ? parseFloat(pricing.subscription_price) : undefined,
          promotional_price: pricing?.promotional_price ? parseFloat(pricing.promotional_price) : undefined,
          discount_percentage: pricing?.discount_percentage ? parseFloat(pricing.discount_percentage) : undefined,
          recognition_period_months: pricing?.recognition_period_months || undefined,
          additional_certificate_price: pricing?.additional_certificate_price ? parseFloat(pricing.additional_certificate_price) : undefined,
          revenue_allocation_method: pricing?.revenue_allocation_method || "",
          discount_eligibility: pricing?.discount_eligibility || "",
          discount_type: pricing?.discount_type || "",
          recognition_start_trigger: pricing?.recognition_start_trigger || "",
          content_format: versionDetail?.sku_version_contents[0]?.content_format || "",
          mobile_compatible: versionDetail?.sku_version_contents[0]?.mobile_compatible || false,
          content_length: versionDetail?.sku_version_contents[0]?.content_length || "",
          instructor_information: versionDetail?.sku_version_contents[0]?.instructor_information || "",
          fulfillment_platform_ids: editingProduct.sku_versions[0]?.sku_version_fulfillment_platforms?.map(fp => fp.fulfillment_platform.fulfillment_platform_id) || [],
          feature_ids: versionDetail?.sku_version_features?.map(f => f.feature.product_feature_id) || [],
          sequence_order: editingProduct.sequence_order || undefined,
          active: editingProduct.active || false,
          not_for_sale: editingProduct.not_for_sale || false,
        });
      } else {
        // Reset form for new product
        form.reset({
          name: "",
          sku: "",
          ecosystem_id: 0,
          brand_id: 0,
          description_short: "",
          description_long: "",
          base_price: 0,
          msrp: undefined,
          cogs: undefined,
          fulfillment_platform_id: undefined,
          sequence_order: undefined,
          product_status: "active" as const,
        });
      }
    }
  }, [isOpen, editingProduct, form]);

  const onSubmit = (data: ProductFormData) => {
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
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand * (Ecosystem will be automatically selected)</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            const brandId = parseInt(value);
                            field.onChange(brandId);
                            
                            // Auto-select ecosystem based on brand
                            const selectedBrand = brands.find(b => b.id === brandId);
                            if (selectedBrand?.ecosystem_id) {
                              form.setValue('ecosystem_id', selectedBrand.ecosystem_id);
                            } else if (ecosystems.length > 0) {
                              // Fallback to first ecosystem if brand doesn't have one assigned
                              form.setValue('ecosystem_id', ecosystems[0].ecosystem_id);
                            }
                          }} 
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select brand (ecosystem will auto-populate)" />
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

                  {/* Show selected ecosystem (read-only) */}
                  {form.watch('ecosystem_id') && (
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Selected Ecosystem:</strong> {ecosystems.find(e => e.ecosystem_id === form.watch('ecosystem_id'))?.ecosystem_name}
                      </p>
                    </div>
                  )}

                  {/* Hidden field for ecosystem_id */}
                  <FormField
                    control={form.control}
                    name="ecosystem_id"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description_short"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Short Description</FormLabel>
                      <FormControl>
                        <Input {...field} maxLength={255} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description_long"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Long Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Pricing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="base_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="pl-8"
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value;
                                field.onChange(value === "" ? undefined : parseFloat(value));
                              }}
                              placeholder="0.00"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="msrp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>MSRP</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cogs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost of Goods</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <Input 
                              type="number" 
                              step="0.01"
                              className="pl-8"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Product Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Product Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sequence_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sequence Order</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            max="255"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Version Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Version Details</h4>
                    
                    <FormField
                      control={form.control}
                      name="version_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Version Name</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Standard, Premium" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="qualifying_education"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Qualifying Education</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="continuing_education"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Continuing Education</FormLabel>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="credit_hours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Hours</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="access_period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Period</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 12 months" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Platform</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Web, Mobile" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Pricing Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="delivery_cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Cost</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? undefined : parseFloat(value));
                                }}
                                placeholder="0.00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subscription_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subscription Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                value={field.value || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === "" ? undefined : parseFloat(value));
                                }}
                                placeholder="0.00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="promotional_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promotional Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="discount_percentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount %</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                max="100"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Content Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Content Information</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="content_format"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Format</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Video, PDF" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="content_length"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Length</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., 2 hours" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="instructor_information"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor Information</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Instructor details..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile_compatible"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Mobile Compatible</FormLabel>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Features Selection */}
                  <div className="space-y-4">
                    <FormLabel>Product Features</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {productFeatures.map((feature) => (
                        <FormField
                          key={feature.product_feature_id}
                          control={form.control}
                          name="feature_ids"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(feature.product_feature_id)}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValues, feature.product_feature_id]);
                                    } else {
                                      field.onChange(currentValues.filter(id => id !== feature.product_feature_id));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {feature.feature_name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Fulfillment Platforms */}
                  <div className="space-y-4">
                    <FormLabel>Fulfillment Platforms</FormLabel>
                    <div className="grid grid-cols-1 gap-2">
                      {fulfillmentPlatforms.map((platform) => (
                        <FormField
                          key={platform.fulfillment_platform_id}
                          control={form.control}
                          name="fulfillment_platform_ids"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.fulfillment_platform_id)}
                                  onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValues, platform.fulfillment_platform_id]);
                                    } else {
                                      field.onChange(currentValues.filter(id => id !== platform.fulfillment_platform_id));
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {platform.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="product_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="active" id="active" />
                              <Label htmlFor="active">Active</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="not_for_sale" id="not_for_sale" />
                              <Label htmlFor="not_for_sale">Not for Sale</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-blue-700"
              >
                {isEditing ? "Update Product" : "Create Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
