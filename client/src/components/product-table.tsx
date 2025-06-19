import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, Copy, Trash2, Columns2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithRelations } from "@shared/schema";

interface ProductTableProps {
  products: ProductWithRelations[];
  isLoading: boolean;
  onEdit: (product: ProductWithRelations) => void;
  onRefresh: () => void;
}

export function ProductTable({ products, isLoading, onEdit, onRefresh }: ProductTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithRelations | null>(null);
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      onRefresh();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("POST", `/api/products/${productId}/clone`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product cloned successfully",
      });
      onRefresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clone product",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (product: ProductWithRelations) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleClone = (product: ProductWithRelations) => {
    cloneMutation.mutate(product.offering_id);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete.offering_id);
    }
  };

  const getProductSku = (product: ProductWithRelations) => {
    return product.sku || "N/A";
  };

  const getProductEcosystem = (product: ProductWithRelations) => {
    // Note: In real implementation, you'd join with ecosystem table
    return "Healthcare"; // Placeholder
  };

  const getProductBrand = (product: ProductWithRelations) => {
    return product.offering_brands[0]?.brand?.name || "N/A";
  };

  const getProductPrice = (product: ProductWithRelations) => {
    const pricing = product.sku_versions[0]?.sku_version_detail?.sku_version_pricing[0];
    if (pricing?.base_price) {
      return `$${parseFloat(pricing.base_price).toFixed(2)}`;
    }
    return "N/A";
  };

  const getProductStatus = (product: ProductWithRelations) => {
    if (product.not_for_sale) return "Draft";
    return product.active ? "Active" : "Inactive";
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active": return "default";
      case "Inactive": return "secondary";
      case "Draft": return "outline";
      default: return "secondary";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-20" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex space-x-4">
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Products</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">{products.length} products</span>
              <Button variant="ghost" size="icon">
                <Columns2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </TableHead>
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </TableHead>
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    Ecosystem
                  </TableHead>
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </TableHead>
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </TableHead>
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No products found. Create your first product to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.offering_id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.description_short}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {getProductSku(product)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {getProductEcosystem(product)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {getProductBrand(product)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {getProductPrice(product)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(getProductStatus(product))}>
                          {getProductStatus(product)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onEdit(product)}
                            className="text-primary hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleClone(product)}
                            disabled={cloneMutation.isPending}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(product)}
                            disabled={deleteMutation.isPending}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
