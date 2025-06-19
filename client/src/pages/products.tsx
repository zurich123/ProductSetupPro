import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/navbar";
import { ProductTable } from "@/components/product-table";
import { ProductFormModal } from "@/components/product-form-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
import type { ProductWithRelations, BrandLookup, Ecosystem } from "@shared/schema";

export default function Products() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const { data: allProducts = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products", search, selectedEcosystem, selectedBrand],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedEcosystem && selectedEcosystem !== "all") params.append("ecosystem_id", selectedEcosystem);
      if (selectedBrand && selectedBrand !== "all") params.append("brand_id", selectedBrand);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Client-side status filtering since it's based on boolean combinations
  const products = allProducts.filter(product => {
    if (!selectedStatus || selectedStatus === "all") return true;
    
    const isActive = product.active && !product.not_for_sale;
    const isInactive = !product.active && product.not_for_sale;
    const isDraft = !product.active && !product.not_for_sale;
    
    switch (selectedStatus) {
      case "active": return isActive;
      case "inactive": return isInactive; 
      case "draft": return isDraft;
      default: return true;
    }
  });

  const { data: brands = [] } = useQuery<BrandLookup[]>({
    queryKey: ["/api/brands"],
  });

  const { data: ecosystems = [] } = useQuery<Ecosystem[]>({
    queryKey: ["/api/ecosystems"],
  });

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: ProductWithRelations) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    refetchProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Product Management</h2>
              <p className="mt-2 text-gray-600">Create, edit, and manage your product catalog</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button 
                onClick={handleCreateProduct}
                className="bg-primary hover:bg-blue-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Product
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedEcosystem} onValueChange={setSelectedEcosystem}>
              <SelectTrigger>
                <SelectValue placeholder="All Ecosystems" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ecosystems</SelectItem>
                {ecosystems.map((ecosystem) => (
                  <SelectItem key={ecosystem.ecosystem_id} value={ecosystem.ecosystem_id.toString()}>
                    {ecosystem.ecosystem_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id.toString()}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Products Table */}
        <ProductTable 
          products={products}
          isLoading={productsLoading}
          onEdit={handleEditProduct}
          onRefresh={refetchProducts}
        />

        {/* Product Form Modal */}
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          editingProduct={editingProduct}
          brands={brands}
          ecosystems={ecosystems}
        />
      </div>
    </div>
  );
}
