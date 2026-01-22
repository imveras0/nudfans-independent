import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Redirect } from "wouter";
import { 
  Users, 
  DollarSign, 
  Eye, 
  Heart, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  Settings,
  BarChart3,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Image as ImageIcon,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Camera,
  Upload,
  FileText,
  Video,
  Move
} from "lucide-react";

export default function Admin() {
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);
  const [selectedCreatorForPost, setSelectedCreatorForPost] = useState<any>(null);
  
  // Fetch admin stats
  const { data: stats, refetch: refetchStats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  
  // Fetch detailed stats for dashboard
  const { data: detailedStats } = trpc.admin.getDetailedStats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });
  
  // Fetch all creators
  const { data: creators, refetch: refetchCreators } = trpc.admin.getAllCreators.useQuery(
    { search: searchTerm },
    { enabled: user?.role === "admin" }
  );
  
  // Fetch all users
  const { data: allUsers } = trpc.admin.getAllUsers.useQuery(
    { search: searchTerm },
    { enabled: user?.role === "admin" }
  );
  
  // Mutations
  const createCreatorMutation = trpc.admin.createCreator.useMutation({
    onSuccess: () => {
      toast.success("Criadora criada com sucesso!");
      setIsCreateDialogOpen(false);
      refetchCreators();
      refetchStats();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const updateCreatorMutation = trpc.admin.updateCreator.useMutation({
    onSuccess: () => {
      toast.success("Criadora atualizada com sucesso!");
      setIsEditDialogOpen(false);
      setSelectedCreator(null);
      refetchCreators();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const deleteCreatorMutation = trpc.admin.deleteCreator.useMutation({
    onSuccess: () => {
      toast.success("Criadora removida com sucesso!");
      refetchCreators();
      refetchStats();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const toggleVerifiedMutation = trpc.admin.toggleVerified.useMutation({
    onSuccess: () => {
      toast.success("Status de verificação atualizado!");
      refetchCreators();
    },
  });
  
  const createPostMutation = trpc.admin.createPostForCreator.useMutation({
    onSuccess: () => {
      toast.success("Post criado com sucesso!");
      setIsCreatePostDialogOpen(false);
      setSelectedCreatorForPost(null);
      refetchStats();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Master</h1>
              <p className="text-xs text-muted-foreground">Painel de Administração</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { refetchStats(); refetchCreators(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/dashboard"}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Main Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="creators" className="gap-2">
              <Crown className="w-4 h-4" />
              Criadoras
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <FileText className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Transações
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <AdminDashboard stats={stats} detailedStats={detailedStats} creators={creators} />
          </TabsContent>
          
          {/* Creators Tab */}
          <TabsContent value="creators" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar criadoras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90">
                    <Plus className="w-4 h-4" />
                    Nova Criadora
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Criadora</DialogTitle>
                    <DialogDescription>
                      Preencha os dados para criar uma nova criadora rapidamente.
                    </DialogDescription>
                  </DialogHeader>
                  <CreateCreatorForm 
                    onSubmit={(data) => createCreatorMutation.mutate(data)}
                    isLoading={createCreatorMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Creators Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {creators?.map((creator: any) => (
                <Card key={creator.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                  <div className="relative h-24 bg-gradient-to-r from-primary/20 to-pink-500/20">
                    {creator.coverUrl && (
                      <img 
                        src={creator.coverUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                        style={{ objectPosition: `center ${creator.coverPositionY || 50}%` }}
                      />
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {creator.isVerified && (
                        <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          Verificada
                        </span>
                      )}
                      {creator.isOnline && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                          Online
                        </span>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-pink-500 overflow-hidden flex-shrink-0 -mt-8 border-2 border-card">
                        {creator.avatarUrl ? (
                          <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold">
                            {creator.displayName?.[0] || "?"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{creator.displayName}</h3>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                        <p className="text-xs text-primary font-medium mt-1">R$ {creator.subscriptionPrice}/mês</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center text-sm">
                      <div>
                        <p className="font-semibold">{creator.stats?.posts || 0}</p>
                        <p className="text-xs text-muted-foreground">Posts</p>
                      </div>
                      <div>
                        <p className="font-semibold">{creator.stats?.followers || 0}</p>
                        <p className="text-xs text-muted-foreground">Seguidores</p>
                      </div>
                      <div>
                        <p className="font-semibold">{creator.stats?.subscribers || 0}</p>
                        <p className="text-xs text-muted-foreground">Assinantes</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setSelectedCreator(creator);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCreatorForPost(creator);
                          setIsCreatePostDialogOpen(true);
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Post
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleVerifiedMutation.mutate({ creatorId: creator.id })}
                      >
                        {creator.isVerified ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja remover esta criadora?")) {
                            deleteCreatorMutation.mutate({ creatorId: creator.id });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {creators?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  Nenhuma criadora encontrada
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-medium">Usuário</th>
                        <th className="text-left p-4 font-medium">Email</th>
                        <th className="text-left p-4 font-medium">Tipo</th>
                        <th className="text-left p-4 font-medium">Role</th>
                        <th className="text-left p-4 font-medium">Cadastro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers?.map((u: any) => (
                        <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                {u.name?.[0] || "?"}
                              </div>
                              <span className="font-medium">{u.name || "Sem nome"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.email || "-"}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              u.userType === "creator" 
                                ? "bg-pink-500/20 text-pink-500" 
                                : "bg-blue-500/20 text-blue-500"
                            }`}>
                              {u.userType === "creator" ? "Criadora" : "Fã"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              u.role === "admin" 
                                ? "bg-yellow-500/20 text-yellow-500" 
                                : "bg-gray-500/20 text-gray-500"
                            }`}>
                              {u.role === "admin" ? "Admin" : "User"}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <PostsManagement />
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <TransactionsTable />
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Aplicativo</CardTitle>
                <CardDescription>Gerencie as configurações gerais da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Taxa da Plataforma</p>
                    <p className="text-sm text-muted-foreground">Porcentagem cobrada em cada transação</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">20%</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Preço Mínimo de Assinatura</p>
                    <p className="text-sm text-muted-foreground">Valor mínimo que criadoras podem cobrar</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">R$ 4.99</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Total de Criadoras</p>
                    <p className="text-sm text-muted-foreground">Criadoras cadastradas na plataforma</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{stats?.totalCreators || 0}</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">Total de Usuários</p>
                    <p className="text-sm text-muted-foreground">Usuários cadastrados na plataforma</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">{stats?.totalUsers || 0}</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Edit Creator Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Criadora</DialogTitle>
            <DialogDescription>
              Atualize os dados da criadora {selectedCreator?.displayName}
            </DialogDescription>
          </DialogHeader>
          {selectedCreator && (
            <EditCreatorForm 
              creator={selectedCreator}
              onSubmit={(data) => updateCreatorMutation.mutate({ creatorId: selectedCreator.id, ...data })}
              isLoading={updateCreatorMutation.isPending}
              onRefresh={() => refetchCreators()}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Post Dialog */}
      <Dialog open={isCreatePostDialogOpen} onOpenChange={setIsCreatePostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Post para {selectedCreatorForPost?.displayName}</DialogTitle>
            <DialogDescription>
              Crie um novo post no perfil desta criadora
            </DialogDescription>
          </DialogHeader>
          {selectedCreatorForPost && (
            <CreatePostForm 
              creator={selectedCreatorForPost}
              onSubmit={(data) => createPostMutation.mutate({ creatorId: selectedCreatorForPost.id, ...data })}
              isLoading={createPostMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard({ stats, detailedStats, creators }: { stats: any; detailedStats: any; creators: any }) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats?.totalCreators || 0}</p>
                <p className="text-sm text-muted-foreground">Criadoras</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
            </div>
            {detailedStats?.creatorsGrowth !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${detailedStats.creatorsGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {detailedStats.creatorsGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(detailedStats.creatorsGrowth)}% este mês
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats?.totalUsers || 0}</p>
                <p className="text-sm text-muted-foreground">Usuários</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            {detailedStats?.usersGrowth !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${detailedStats.usersGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {detailedStats.usersGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(detailedStats.usersGrowth)}% este mês
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">R$ {stats?.totalRevenue || "0"}</p>
                <p className="text-sm text-muted-foreground">Receita Total</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
            {detailedStats?.revenueGrowth !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${detailedStats.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {detailedStats.revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(detailedStats.revenueGrowth)}% este mês
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border-pink-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{stats?.totalSubscriptions || 0}</p>
                <p className="text-sm text-muted-foreground">Assinaturas</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{detailedStats?.totalPosts || 0}</p>
              <p className="text-xs text-muted-foreground">Posts Totais</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{detailedStats?.totalViews || 0}</p>
              <p className="text-xs text-muted-foreground">Visualizações</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <div>
              <p className="text-2xl font-bold">{detailedStats?.totalLikes || 0}</p>
              <p className="text-xs text-muted-foreground">Curtidas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">R$ {detailedStats?.platformFees || "0"}</p>
              <p className="text-xs text-muted-foreground">Taxa Plataforma</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Creators & Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Creators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Top Criadoras
            </CardTitle>
            <CardDescription>Criadoras com mais assinantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creators?.slice(0, 5).map((creator: any, index: number) => (
                <div key={creator.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-500 text-yellow-950' :
                    index === 1 ? 'bg-gray-300 text-gray-700' :
                    index === 2 ? 'bg-amber-600 text-amber-100' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20">
                    {creator.avatarUrl ? (
                      <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                        {creator.displayName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{creator.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{creator.username}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{creator.stats?.subscribers || 0}</p>
                    <p className="text-xs text-muted-foreground">assinantes</p>
                  </div>
                </div>
              ))}
              {(!creators || creators.length === 0) && (
                <p className="text-center text-muted-foreground py-4">Nenhuma criadora ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Platform Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Visão Geral
            </CardTitle>
            <CardDescription>Métricas da plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Criadoras Verificadas</span>
                <span className="font-semibold">{detailedStats?.verifiedCreators || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Criadoras Online</span>
                <span className="font-semibold text-green-500">{detailedStats?.onlineCreators || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Média de Posts/Criadora</span>
                <span className="font-semibold">{detailedStats?.avgPostsPerCreator?.toFixed(1) || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Preço Médio Assinatura</span>
                <span className="font-semibold">R$ {detailedStats?.avgSubscriptionPrice || "9.99"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">Conversões (Fã → Assinante)</span>
                <span className="font-semibold">{detailedStats?.conversionRate || 0}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Create Creator Form Component
function CreateCreatorForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    location: "",
    subscriptionPrice: "9.99",
    isVerified: false,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const confirmUploadMutation = trpc.media.confirmUpload.useMutation();
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const uploadImage = async (file: File, type: 'avatar' | 'cover'): Promise<string> => {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const fileKey = `${type}s/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          const result = await confirmUploadMutation.mutateAsync({
            fileKey,
            fileBuffer: base64,
            contentType: file.type,
          });
          resolve(result.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let avatarUrl = undefined;
      let coverUrl = undefined;
      
      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, 'avatar');
      }
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'cover');
      }
      
      onSubmit({ ...formData, avatarUrl, coverUrl });
    } catch (error) {
      toast.error("Erro ao fazer upload das imagens");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover Image */}
      <div className="space-y-2">
        <Label>Foto de Capa</Label>
        <div 
          className="relative h-32 bg-gradient-to-r from-primary/20 to-pink-500/20 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para adicionar capa</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
      </div>
      
      {/* Avatar and Basic Info */}
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>Foto de Perfil</Label>
          <div 
            className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-pink-500 overflow-hidden cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                ?
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="ex: maria_silva"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição *</Label>
            <Input
              id="displayName"
              placeholder="ex: Maria Silva"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              required
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          placeholder="Descrição da criadora..."
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            placeholder="ex: São Paulo, Brasil"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço Mensal (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="4.99"
            value={formData.subscriptionPrice}
            onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          id="verified"
          checked={formData.isVerified}
          onCheckedChange={(checked) => setFormData({ ...formData, isVerified: checked })}
        />
        <Label htmlFor="verified">Conta Verificada</Label>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
        {(isLoading || isUploading) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
        {isUploading ? "Enviando imagens..." : "Criar Criadora"}
      </Button>
    </form>
  );
}

// Edit Creator Form Component
function EditCreatorForm({ creator, onSubmit, isLoading, onRefresh }: { creator: any; onSubmit: (data: any) => void; isLoading: boolean; onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    displayName: creator.displayName || "",
    bio: creator.bio || "",
    location: creator.location || "",
    subscriptionPrice: creator.subscriptionPrice || "9.99",
    isVerified: creator.isVerified || false,
    isOnline: creator.isOnline || false,
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(creator.avatarUrl || null);
  const [coverPreview, setCoverPreview] = useState<string | null>(creator.coverUrl || null);
  const [coverPositionY, setCoverPositionY] = useState(creator.coverPositionY || 50);
  const [isUploading, setIsUploading] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const confirmUploadMutation = trpc.media.confirmUpload.useMutation();
  const updateAvatarMutation = trpc.admin.updateCreatorAvatar.useMutation({
    onSuccess: () => {
      toast.success("Avatar atualizado!");
      onRefresh();
    },
  });
  const updateCoverMutation = trpc.admin.updateCreatorCover.useMutation({
    onSuccess: () => {
      toast.success("Capa atualizada!");
      onRefresh();
    },
  });
  const updateCoverPositionMutation = trpc.admin.updateCoverPosition.useMutation({
    onSuccess: () => {
      toast.success("Posição da capa atualizada!");
      onRefresh();
    },
  });
  
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
      
      // Upload immediately
      setIsUploading(true);
      try {
        const base64Reader = new FileReader();
        base64Reader.onloadend = async () => {
          const base64 = (base64Reader.result as string).split(',')[1];
          const fileKey = `avatars/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          const result = await confirmUploadMutation.mutateAsync({
            fileKey,
            fileBuffer: base64,
            contentType: file.type,
          });
          await updateAvatarMutation.mutateAsync({ creatorId: creator.id, avatarUrl: result.url });
        };
        base64Reader.readAsDataURL(file);
      } catch (error) {
        toast.error("Erro ao atualizar avatar");
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
      
      // Upload immediately
      setIsUploading(true);
      try {
        const base64Reader = new FileReader();
        base64Reader.onloadend = async () => {
          const base64 = (base64Reader.result as string).split(',')[1];
          const fileKey = `covers/${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
          const result = await confirmUploadMutation.mutateAsync({
            fileKey,
            fileBuffer: base64,
            contentType: file.type,
          });
          await updateCoverMutation.mutateAsync({ creatorId: creator.id, coverUrl: result.url });
        };
        base64Reader.readAsDataURL(file);
      } catch (error) {
        toast.error("Erro ao atualizar capa");
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handleCoverPositionChange = (value: number[]) => {
    setCoverPositionY(value[0]);
  };
  
  const saveCoverPosition = () => {
    updateCoverPositionMutation.mutate({ creatorId: creator.id, coverPositionY });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cover Image with Position Control */}
      <div className="space-y-2">
        <Label>Foto de Capa</Label>
        <div 
          className="relative h-32 bg-gradient-to-r from-primary/20 to-pink-500/20 rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverPreview ? (
            <img 
              src={coverPreview} 
              alt="Cover preview" 
              className="w-full h-full object-cover"
              style={{ objectPosition: `center ${coverPositionY}%` }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para adicionar capa</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" />
            {isUploading && <Loader2 className="w-6 h-6 text-white animate-spin ml-2" />}
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />
        
        {/* Cover Position Slider */}
        {coverPreview && (
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <Move className="w-4 h-4" />
                Ajustar Posição da Capa
              </Label>
              <span className="text-xs text-muted-foreground">{coverPositionY}%</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Topo</span>
              <Slider
                value={[coverPositionY]}
                onValueChange={handleCoverPositionChange}
                min={0}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Base</span>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={saveCoverPosition}
              disabled={updateCoverPositionMutation.isPending}
              className="w-full mt-2"
            >
              {updateCoverPositionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Salvar Posição
            </Button>
          </div>
        )}
      </div>
      
      {/* Avatar and Basic Info */}
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>Foto de Perfil</Label>
          <div 
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-pink-500 overflow-hidden cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                {creator.displayName?.[0] || "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-6 h-6 text-white" />
              {isUploading && <Loader2 className="w-4 h-4 text-white animate-spin ml-1" />}
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        
        <div className="flex-1">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nome de Exibição</Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">@{creator.username}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={3}
          placeholder="Descrição da criadora..."
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="ex: São Paulo, Brasil"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Preço Mensal (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="4.99"
            value={formData.subscriptionPrice}
            onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
          />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Switch
            id="verified"
            checked={formData.isVerified}
            onCheckedChange={(checked) => setFormData({ ...formData, isVerified: checked })}
          />
          <Label htmlFor="verified">Conta Verificada</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="online"
            checked={formData.isOnline}
            onCheckedChange={(checked) => setFormData({ ...formData, isOnline: checked })}
          />
          <Label htmlFor="online">Status Online</Label>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading || isUploading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
        Salvar Alterações
      </Button>
    </form>
  );
}

// Create Post Form Component
function CreatePostForm({ creator, onSubmit, isLoading }: { creator: any; onSubmit: (data: any) => void; isLoading: boolean }) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"free" | "subscription" | "ppv">("free");
  const [ppvPrice, setPpvPrice] = useState("9.99");
  const [blurIntensity, setBlurIntensity] = useState(20);
  const [mediaItems, setMediaItems] = useState<Array<{
    mediaType: "image" | "video";
    url: string;
    fileKey: string;
    thumbnailUrl?: string;
    file?: File;
    preview?: string;
  }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirmUploadMutation = trpc.media.confirmUpload.useMutation();
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newItems: typeof mediaItems = [];
    
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      
      await new Promise<void>((resolve) => {
        reader.onloadend = () => {
          newItems.push({
            mediaType: isVideo ? "video" : "image",
            url: "",
            fileKey: "",
            preview: reader.result as string,
            file,
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    setMediaItems([...mediaItems, ...newItems]);
  };
  
  const removeMedia = (index: number) => {
    setMediaItems(mediaItems.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mediaItems.length === 0) {
      toast.error("Adicione pelo menos uma foto ou vídeo");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload all media files
      const uploadedMedia = await Promise.all(
        mediaItems.map(async (item) => {
          if (!item.file) return item;
          
          const base64 = item.preview!.split(',')[1];
          const fileKey = `creators/${creator.id}/posts/${Date.now()}-${Math.random().toString(36).substring(7)}.${item.file.name.split('.').pop()}`;
          
          const result = await confirmUploadMutation.mutateAsync({
            fileKey,
            fileBuffer: base64,
            contentType: item.file.type,
          });
          
          return {
            mediaType: item.mediaType,
            url: result.url,
            fileKey,
          };
        })
      );
      
      onSubmit({
        content,
        postType,
        ppvPrice: postType === "ppv" ? ppvPrice : undefined,
        blurIntensity: postType !== "free" ? blurIntensity : undefined,
        mediaItems: uploadedMedia.filter(m => m.url),
      });
    } catch (error) {
      toast.error("Erro ao fazer upload das mídias");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Creator Info */}
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/20">
          {creator.avatarUrl ? (
            <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary font-bold">
              {creator.displayName?.[0]}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold">{creator.displayName}</p>
          <p className="text-sm text-muted-foreground">@{creator.username}</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Legenda</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva uma legenda para o post..."
          rows={3}
        />
      </div>
      
      {/* Media Upload */}
      <div className="space-y-2">
        <Label>Mídia</Label>
        <div 
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Clique para adicionar fotos ou vídeos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Máximo 10 arquivos
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {/* Media Preview */}
        {mediaItems.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {mediaItems.map((item, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                {item.mediaType === "image" ? (
                  <img src={item.preview || item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <Video className="w-8 h-8 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-black"
                >
                  <XCircle className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Post Type */}
      <div className="space-y-2">
        <Label>Tipo de Post</Label>
        <Select value={postType} onValueChange={(v) => setPostType(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Gratuito (visível para todos)</SelectItem>
            <SelectItem value="subscription">Apenas Assinantes</SelectItem>
            <SelectItem value="ppv">PPV (Pay-Per-View)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* PPV Price */}
      {postType === "ppv" && (
        <div className="space-y-2">
          <Label htmlFor="ppvPrice">Preço PPV (R$)</Label>
          <Input
            id="ppvPrice"
            type="number"
            step="0.01"
            min="0.50"
            value={ppvPrice}
            onChange={(e) => setPpvPrice(e.target.value)}
          />
        </div>
      )}
      
      {/* Blur Intensity */}
      {postType !== "free" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Intensidade do Blur</Label>
            <span className="text-sm text-muted-foreground">{blurIntensity}%</span>
          </div>
          <Slider
            value={[blurIntensity]}
            onValueChange={(v) => setBlurIntensity(v[0])}
            min={0}
            max={50}
            step={5}
          />
        </div>
      )}
      
      <Button type="submit" className="w-full" disabled={isLoading || isUploading || mediaItems.length === 0}>
        {(isLoading || isUploading) ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Plus className="w-4 h-4 mr-2" />
        )}
        {isUploading ? "Enviando mídia..." : "Criar Post"}
      </Button>
    </form>
  );
}

// Posts Management Component
function PostsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCreatorId, setSelectedCreatorId] = useState<number | null>(null);
  
  const { data: creators } = trpc.admin.getAllCreators.useQuery({ search: "" });
  const { data: posts, refetch: refetchPosts } = trpc.admin.getAllPosts.useQuery(
    { creatorId: selectedCreatorId || undefined, search: searchTerm },
    { enabled: true }
  );
  
  const deletePostMutation = trpc.admin.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post excluído com sucesso!");
      refetchPosts();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const handleDeletePost = (postId: number) => {
    if (confirm("Tem certeza que deseja excluir este post?")) {
      deletePostMutation.mutate({ postId });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCreatorId?.toString() || "all"} onValueChange={(v) => setSelectedCreatorId(v === "all" ? null : parseInt(v))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas as criadoras" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as criadoras</SelectItem>
            {creators?.map((c: any) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts?.map((post: any) => (
          <Card key={post.id} className="overflow-hidden">
            <div className="relative aspect-square bg-muted">
              {post.media?.[0] && (
                post.media[0].mediaType === "image" ? (
                  <img src={post.media[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <video src={post.media[0].url} className="w-full h-full object-cover" />
                )
              )}
              <div className="absolute top-2 right-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeletePost(post.id)}
                  disabled={deletePostMutation.isPending}
                >
                  {deletePostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/20">
                  {post.creator.avatarUrl ? (
                    <img src={post.creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary text-xs font-bold">
                      {post.creator.displayName?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{post.creator.displayName}</p>
                  <p className="text-xs text-muted-foreground">@{post.creator.username}</p>
                </div>
              </div>
              <p className="text-sm line-clamp-2 mb-2">{post.content}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {post.likes_count || 0}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  post.postType === "free" 
                    ? "bg-green-500/20 text-green-500" 
                    : post.postType === "subscription"
                    ? "bg-purple-500/20 text-purple-500"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}>
                  {post.postType === "free" ? "Gratuito" : post.postType === "subscription" ? "Assinantes" : "PPV"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!posts || posts.length === 0) && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            Nenhum post encontrado
          </div>
        )}
      </div>
    </div>
  );
}

// Transactions Table Component
function TransactionsTable() {
  const { data: transactions } = trpc.admin.getTransactions.useQuery();
  
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium">ID</th>
                <th className="text-left p-4 font-medium">Tipo</th>
                <th className="text-left p-4 font-medium">Valor</th>
                <th className="text-left p-4 font-medium">Taxa</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {transactions?.map((t: any) => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4 font-mono text-sm">#{t.id}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      t.type === "subscription" 
                        ? "bg-purple-500/20 text-purple-500" 
                        : t.type === "tip"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-blue-500/20 text-blue-500"
                    }`}>
                      {t.type === "subscription" ? "Assinatura" : t.type === "tip" ? "Gorjeta" : "PPV"}
                    </span>
                  </td>
                  <td className="p-4 font-medium">R$ {t.amount}</td>
                  <td className="p-4 text-muted-foreground">R$ {t.platformFee}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      t.status === "completed" 
                        ? "bg-green-500/20 text-green-500" 
                        : t.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "bg-red-500/20 text-red-500"
                    }`}>
                      {t.status === "completed" ? "Concluído" : t.status === "pending" ? "Pendente" : "Falhou"}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
              {(!transactions || transactions.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
