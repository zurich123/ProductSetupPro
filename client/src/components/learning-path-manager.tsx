import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ArrowDown, BookOpen, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProductWithRelations } from "@shared/schema";

interface LearningPath {
  path_id: number;
  name: string;
  description: string;
  path_type: "bundle" | "pathway" | "sequence";
  active: boolean;
  items: LearningPathItem[];
}

interface LearningPathItem {
  path_item_id: number;
  path_id: number;
  offering_id: string;
  sequence_order: number;
  is_required: boolean;
  prerequisite_offering_id?: string;
  product?: ProductWithRelations;
}

interface LearningPathManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LearningPathManager({ isOpen, onClose }: LearningPathManagerProps) {
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const { data: learningPaths = [], refetch } = useQuery<LearningPath[]>({
    queryKey: ["/api/learning-paths"],
    enabled: isOpen,
  });

  const { data: products = [] } = useQuery<ProductWithRelations[]>({
    queryKey: ["/api/products"],
    enabled: isOpen,
  });

  const createPathMutation = useMutation({
    mutationFn: async (pathData: Partial<LearningPath>) => {
      return apiRequest("/api/learning-paths", {
        method: "POST",
        body: JSON.stringify(pathData),
      });
    },
    onSuccess: () => {
      toast({ title: "Learning path created successfully" });
      refetch();
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Failed to create learning path", variant: "destructive" });
    },
  });

  const addItemMutation = useMutation({
    mutationFn: async ({ pathId, offeringId }: { pathId: number; offeringId: string }) => {
      return apiRequest(`/api/learning-paths/${pathId}/items`, {
        method: "POST",
        body: JSON.stringify({ offering_id: offeringId }),
      });
    },
    onSuccess: () => {
      toast({ title: "Product added to learning path" });
      refetch();
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    },
  });

  const handleCreatePath = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPathMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      path_type: formData.get("path_type") as "bundle" | "pathway" | "sequence",
      active: true,
    });
  };

  const getPathTypeIcon = (type: string) => {
    switch (type) {
      case "bundle": return <Target className="h-4 w-4" />;
      case "pathway": return <ArrowDown className="h-4 w-4" />;
      case "sequence": return <BookOpen className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getPathTypeBadge = (type: string) => {
    const colors = {
      bundle: "bg-blue-100 text-blue-800",
      pathway: "bg-green-100 text-green-800", 
      sequence: "bg-purple-100 text-purple-800"
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Learning Path Manager</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Paths List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Learning Paths</h3>
              <Button onClick={() => setIsCreating(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Path
              </Button>
            </div>

            {isCreating && (
              <Card>
                <CardHeader>
                  <CardTitle>Create New Learning Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePath} className="space-y-4">
                    <Input name="name" placeholder="Path name" required />
                    <Textarea name="description" placeholder="Path description" />
                    <Select name="path_type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select path type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bundle">Bundle - Collection of related courses</SelectItem>
                        <SelectItem value="pathway">Pathway - Guided learning journey</SelectItem>
                        <SelectItem value="sequence">Sequence - Sequential course order</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={createPathMutation.isPending}>
                        Create
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {learningPaths.map((path) => (
                <Card 
                  key={path.path_id} 
                  className={`cursor-pointer transition-colors ${
                    selectedPath?.path_id === path.path_id ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedPath(path)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{path.name}</h4>
                      <Badge className={getPathTypeBadge(path.path_type)}>
                        <span className="flex items-center gap-1">
                          {getPathTypeIcon(path.path_type)}
                          {path.path_type}
                        </span>
                      </Badge>
                    </div>
                    {path.description && (
                      <p className="text-sm text-gray-600 mb-2">{path.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {path.items?.length || 0} courses
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Path Details */}
          <div className="space-y-4">
            {selectedPath ? (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Path Configuration</h3>
                  <Badge className={getPathTypeBadge(selectedPath.path_type)}>
                    {selectedPath.path_type}
                  </Badge>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>{selectedPath.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPath.description && (
                      <p className="text-gray-600">{selectedPath.description}</p>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-medium">Add Products to Path</h4>
                      <Select 
                        onValueChange={(offeringId) => {
                          addItemMutation.mutate({ 
                            pathId: selectedPath.path_id, 
                            offeringId 
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.offering_id} value={product.offering_id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Path Items</h4>
                      {selectedPath.items && selectedPath.items.length > 0 ? (
                        <div className="space-y-2">
                          {selectedPath.items.map((item, index) => (
                            <div key={item.path_item_id} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                  {index + 1}
                                </span>
                                <div>
                                  <div className="font-medium">
                                    {item.product?.name || "Unknown Product"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.product?.sku}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.is_required ? (
                                  <Badge variant="default">Required</Badge>
                                ) : (
                                  <Badge variant="secondary">Optional</Badge>
                                )}
                                <Button variant="ghost" size="sm">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No products added to this path yet
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a learning path to view details
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}