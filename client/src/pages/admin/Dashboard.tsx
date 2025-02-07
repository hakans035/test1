import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AIModel, Category, ChatbotConfig, ChatbotFile, ApiKey } from "@shared/schema";
import { Loader2, TestTube, Edit, Circle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import MemberManagement from "./MemberManagement";

// FileManagementDialog component to handle file selection state
function FileManagementDialog({ onFilesSelected }: { onFilesSelected: (fileIds: number[]) => void }) {
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for files
  const { data: files = [], isLoading: isLoadingFiles } = useQuery<ChatbotFile[]>({
    queryKey: ['/api/admin/files'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/files", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json();
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/files", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload files");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      toast({ title: "Success", description: "Files uploaded successfully" });
    },
    onError: (error: Error) => {
      console.error("File upload error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to upload files. Please try again."
      });
    },
  });

  // Delete files mutation
  const deleteFilesMutation = useMutation({
    mutationFn: async (fileIds: number[]) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fileIds }),
      });
      if (!response.ok) throw new Error("Failed to delete files");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/files"] });
      toast({ title: "Success", description: "Files deleted successfully" });
      setSelectedFiles([]);
    },
    onError: (error) => {
      console.error("File deletion error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete files. Please try again."
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.files && event.target.files.length > 0) {
        await uploadFileMutation.mutateAsync(event.target.files);
      }
    } catch (error) {
      console.error("File upload error:", error);
    } finally {
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleDeleteFiles = () => {
    if (selectedFiles.length > 0) {
      deleteFilesMutation.mutate(selectedFiles);
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  const toggleFileSelection = (fileId: number) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleConfirm = () => {
    onFilesSelected(selectedFiles);
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Knowledge Base Files</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div>
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer" asChild>
                <div>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </div>
              </Button>
            </label>
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteFiles}
            disabled={selectedFiles.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedFiles.length === files.length && files.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingFiles ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                    No files uploaded yet
                  </TableCell>
                </TableRow>
              ) : (
                files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                    </TableCell>
                    <TableCell>{file.fileName}</TableCell>
                    <TableCell>{file.fileType}</TableCell>
                    <TableCell>{Math.round(file.fileSize / 1024)} KB</TableCell>
                    <TableCell>
                      {new Date(file.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DialogFooter>
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-muted-foreground">
            {selectedFiles.length} files selected
          </div>
          <Button onClick={handleConfirm}>
            Confirm Selection
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingChatbot, setEditingChatbot] = useState<ChatbotConfig | null>(null);

  // Data fetching with authorization
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/categories", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: models = [] } = useQuery<AIModel[]>({
    queryKey: ["/api/admin/models"],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/models", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch models");
      return response.json();
    },
  });

  const { data: chatbots = [] } = useQuery<ChatbotConfig[]>({
    queryKey: ["/api/admin/chatbots"],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/chatbots", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch chatbots");
      return response.json();
    },
  });

  const { data: files = [], isLoading: isLoadingFiles } = useQuery<ChatbotFile[]>({
    queryKey: ["/api/admin/files"],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/files", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      return response.json();
    },
  });

  // Form states
  const [newChatbot, setNewChatbot] = useState<ChatbotConfig>({
    name: "",
    description: "",
    categoryId: null,
    modelId: null,
    systemPrompt: "Be precise and concise.",
    active: true,
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const [newApiKey, setNewApiKey] = useState({
    name: "",
    provider: "",
    value: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLocation("/admin");
      }
    });
    return unsubscribe;
  }, [setLocation]);


  // Create chatbot mutation with file associations
  const createChatbotMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/chatbots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ...data, fileIds: selectedFileIds }),
      });
      if (!response.ok) throw new Error("Failed to create chatbot");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbots"] });
      toast({ title: "Success", description: "Chatbot created successfully" });
      setNewChatbot({ name: "", description: "", categoryId: null, modelId: null, systemPrompt: "Be precise and concise.", active: true });
      setSelectedFileIds([]);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create chatbot" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Success", description: "Category created successfully" });
      setNewCategory({ name: "", description: "" });
    },
    onError: (error: any) => {
      console.error("Category creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create category",
      });
    },
  });

  // Add delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Success", description: "Category deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete category",
      });
    },
  });

  // Add update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/categories"] });
      toast({ title: "Success", description: "Category updated successfully" });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update category",
      });
    },
  });

  // Add API keys query
  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ["/api/admin/api-keys"],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/api-keys", {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch API keys");
      return response.json();
    },
  });

  // Add delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete API key");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "Success", description: "API key deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete API key" });
    },
  });

  // Add save API key mutation with auth token
  const saveApiKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to save API key");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-keys"] });
      toast({ title: "Success", description: "API key saved successfully" });
      setNewApiKey({ name: "", provider: "", value: "" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to save API key" });
    },
  });

  const testApiKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/api-keys/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to test API key");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "API key connection test successful!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to test API key connection",
      });
    },
  });

  // Function to generate API key name based on provider
  const generateApiKeyName = (provider: string, value: string) => {
    if (!provider || !value) return "";
    const prefix = provider.toUpperCase();
    return `${prefix}_API_KEY`;
  };

  // Handle API key value change
  const handleApiKeyValueChange = (value: string) => {
    setNewApiKey(prev => ({
      ...prev,
      value,
      name: generateApiKeyName(prev.provider, value)
    }));
  };

  // Handle provider change
  const handleProviderChange = (value: string) => {
    setNewApiKey(prev => ({
      ...prev,
      provider: value,
      name: generateApiKeyName(value, prev.value)
    }));
  };

  const handleFilesSelected = (fileIds: number[]) => {
    setSelectedFileIds(fileIds);
    setIsFileDialogOpen(false);
  };

  // Add createDefaultModels mutation
  const createDefaultModelsMutation = useMutation({
    mutationFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/admin/models/defaults", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to create default models");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/models"] });
      toast({ title: "Success", description: "Default AI models created successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create default AI models",
      });
    },
  });


  const updateChatbotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ChatbotConfig> }) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/chatbots/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update chatbot");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbots"] });
      toast({ title: "Success", description: "Chatbot updated successfully" });
      setEditingChatbot(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update chatbot",
      });
    },
  });

  const deleteChatbotMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/admin/chatbots/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete chatbot");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbots"] });
      toast({ title: "Success", description: "Chatbot deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete chatbot",
      });
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={() => auth.signOut()}>
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="chatbots" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chatbots">Chatbot Configs</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="chatbots">
          <Card>
            <CardHeader>
              <CardTitle>Chatbots</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chatbots List */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatbots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No chatbots created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      chatbots.map((chatbot) => (
                        <TableRow key={chatbot.id}>
                          <TableCell>
                            {editingChatbot?.id === chatbot.id ? (
                              <Input
                                value={editingChatbot.name}
                                onChange={(e) =>
                                  setEditingChatbot({
                                    ...editingChatbot,
                                    name: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              chatbot.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingChatbot?.id === chatbot.id ? (
                              <Input
                                value={editingChatbot.description || ""}
                                onChange={(e) =>
                                  setEditingChatbot({
                                    ...editingChatbot,
                                    description: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              chatbot.description
                            )}
                          </TableCell>
                          <TableCell>
                            {editingChatbot?.id === chatbot.id ? (
                              <Select
                                value={editingChatbot.categoryId?.toString() || ""}
                                onValueChange={(value) =>
                                  setEditingChatbot({
                                    ...editingChatbot,
                                    categoryId: parseInt(value),
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories?.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              categories Continuing exactly where we left off with the Dashboard.tsx file:

```tsx
                              categories.find((c) => c.id === chatbot.categoryId)?.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingChatbot?.id === chatbot.id ? (
                              <Select
                                value={editingChatbot.modelId?.toString() || ""}
                                onValueChange={(value) =>
                                  setEditingChatbot({
                                    ...editingChatbot,
                                    modelId: parseInt(value),
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select AI model" />
                                </SelectTrigger>
                                <SelectContent>
                                  {models?.map((model) => (
                                    <SelectItem key={model.id} value={model.id.toString()}>
                                      {model.name} ({model.provider})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              models.find((m) => m.id === chatbot.modelId)?.name
                            )}
                          </TableCell>
                          <TableCell>
                            <Circle
                              className={`w-3 h-3 ${
                                chatbot.active ? "text-green-500 fill-green-500" : "text-red-500 fill-red-500"
                              }`}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {editingChatbot?.id === chatbot.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      updateChatbotMutation.mutate({
                                        id: chatbot.id,
                                        data: {
                                          name: editingChatbot.name,
                                          description: editingChatbot.description,
                                          categoryId: editingChatbot.categoryId,
                                          modelId: editingChatbot.modelId,
                                          systemPrompt: editingChatbot.systemPrompt,
                                          active: editingChatbot.active,
                                        },
                                      });
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingChatbot(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingChatbot(chatbot)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this chatbot?")) {
                                        deleteChatbotMutation.mutate(chatbot.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Create New Chatbot Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Chatbot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newChatbot.name}
                      onChange={(e) => setNewChatbot({ ...newChatbot, name: e.target.value })}
                      placeholder="Enter chatbot name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newChatbot.description}
                      onChange={(e) => setNewChatbot({ ...newChatbot, description: e.target.value })}
                      placeholder="Enter chatbot description"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newChatbot.categoryId?.toString() || ""}
                      onValueChange={(value) => setNewChatbot({ ...newChatbot, categoryId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">AI Model</label>
                    <Select
                      value={newChatbot.modelId?.toString() || ""}
                      onValueChange={(value) => setNewChatbot({ ...newChatbot, modelId: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models?.map((model) => (
                          <SelectItem key={model.id} value={model.id.toString()}>
                            {model.name} ({model.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">System Prompt</label>
                    <Textarea
                      value={newChatbot.systemPrompt}
                      onChange={(e) => setNewChatbot({ ...newChatbot, systemPrompt: e.target.value })}
                      placeholder="Enter system prompt for the AI assistant"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Knowledge Base Files</label>
                    <div className="flex gap-4 items-center mb-4">
                      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">Manage Files</Button>
                        </DialogTrigger>
                        <FileManagementDialog onFilesSelected={handleFilesSelected} />
                      </Dialog>
                      <div className="text-sm text-muted-foreground">
                        {selectedFileIds.length} files selected
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (!newChatbot.categoryId || !newChatbot.modelId) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: "Please select both a category and AI model",
                        });
                        return;
                      }
                      createChatbotMutation.mutate({ ...newChatbot, fileIds: selectedFileIds })
                    }}
                    disabled={!newChatbot.name || !newChatbot.categoryId || !newChatbot.modelId}
                  >
                    Create Chatbot
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Categories List */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No categories created yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            {editingCategory?.id === category.id ? (
                              <Input
                                value={editingCategory.name}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    name: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              category.name
                            )}
                          </TableCell>
                          <TableCell>
                            {editingCategory?.id === category.id ? (
                              <Input
                                value={editingCategory.description || ""}
                                onChange={(e) =>
                                  setEditingCategory({
                                    ...editingCategory,
                                    description: e.target.value,
                                  })
                                }
                              />
                            ) : (
                              category.description
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(category.createdAt || "").toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {editingCategory?.id === category.id ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      updateCategoryMutation.mutate({
                                        id: category.id,
                                        data: {
                                          name: editingCategory.name,
                                          description: editingCategory.description,
                                        },
                                      });
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingCategory(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingCategory(category)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm("Are you sure you want to delete this category?")) {
                                        deleteCategoryMutation.mutate(category.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Create New Category Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Category</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Enter category name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Enter category description"
                    />
                  </div>

                  <Button onClick={() => createCategoryMutation.mutate(newCategory)}>
                    Create Category
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>API Keys Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Keys List */}
              <div className="border rounded-lg mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Last Tested</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No API keys configured
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>
                            <Circle
                              className={`w-3 h-3 ${
                                key.active ? "text-green-500 fill-green-500" : "text-red-500 fill-red-500"
                              }`}
                            />
                          </TableCell>
                          <TableCell className="capitalize">{key.provider}</TableCell>
                          <TableCell>{key.name}</TableCell>
                          <TableCell>
                            {key.lastTested
                              ? new Date(key.lastTested || '').toLocaleDateString()
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNewApiKey({
                                    provider: key.provider,
                                    name: key.name,
                                    value: "",
                                  });
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteApiKeyMutation.mutate(key.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* API Key Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Select
                    value={newApiKey.provider}
                    onValueChange={handleProviderChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="deepseek">Deepseek</SelectItem>
                      <SelectItem value="qwen">Qwen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key Value</label>
                  <Input
                    type="password"
                    value={newApiKey.value}
                    onChange={(e) => handleApiKeyValueChange(e.target.value)}
                    placeholder="Enter API key"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key Name</label>
                  <Input
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    placeholder="Environment variable name"
                    disabled={!newApiKey.value}
                  />
                </div>

                <div className="flex gap-4">
                  <Button 
                    onClick={() => saveApiKeyMutation.mutate(newApiKey)}
                    disabled={!newApiKey.name || !newApiKey.provider || !newApiKey.value}
                  >
                    {saveApiKeyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save API Key'
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => testApiKeyMutation.mutate(newApiKey)}
                    disabled={!newApiKey.value || !newApiKey.provider || testApiKeyMutation.isPending}
                  >
                    {testApiKeyMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr2" />
                        Test Connection
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
            </CardHeader>
            <CardContent>
              <MemberManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}