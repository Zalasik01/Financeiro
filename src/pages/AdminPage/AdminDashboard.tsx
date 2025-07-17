import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle,
  Database,
  Eye,
  Plus,
  RefreshCw,
  Shield,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalBases: number;
  activeBases: number;
  inactiveBases: number;
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentBases: number;
  recentUsers: number;
}

interface ClientBase {
  id: string;
  name: string;
  ativo: boolean;
  createdAt: number;
  createdBy: string;
  numberId: number;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  createdAt?: number;
}

const StatCard: React.FC<{
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}> = ({ title, value, description, icon: Icon, trend, badge }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground">{description}</p>
          {trend && (
            <div
              className={`flex items-center text-xs mt-1 ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 mr-1 ${
                  trend.isPositive ? "" : "rotate-180"
                }`}
              />
              {trend.isPositive ? "+" : ""}
              {trend.value}% este mês
            </div>
          )}
        </div>
        {badge && <Badge variant={badge.variant}>{badge.text}</Badge>}
      </div>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalBases: 0,
    activeBases: 0,
    inactiveBases: 0,
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    recentBases: 0,
    recentUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBases, setRecentBases] = useState<ClientBase[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const loadDashboardData = () => {
      // Carregar dados das bases
      const basesRef = ref(db, "clientBases");
      const unsubscribeBases = onValue(basesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const bases: ClientBase[] = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          const now = Date.now();
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

          const activeBases = bases.filter((b) => b.ativo).length;
          const inactiveBases = bases.filter((b) => !b.ativo).length;
          const recentBasesCount = bases.filter(
            (b) => b.createdAt > thirtyDaysAgo
          ).length;

          // Bases mais recentes (últimas 5)
          const sortedBases = bases
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 5);

          setRecentBases(sortedBases);
          setStats((prev) => ({
            ...prev,
            totalBases: bases.length,
            activeBases,
            inactiveBases,
            recentBases: recentBasesCount,
          }));
        }
      });

      // Carregar dados dos usuários
      const usersRef = ref(db, "users");
      const unsubscribeUsers = onValue(usersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const users: UserProfile[] = Object.keys(data).map((uid) => ({
            uid,
            email: data[uid].profile?.email || "",
            displayName: data[uid].profile?.displayName,
            isAdmin: data[uid].profile?.isAdmin || false,
            createdAt: data[uid].profile?.createdAt || Date.now(),
          }));

          const now = Date.now();
          const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

          const adminUsers = users.filter((u) => u.isAdmin).length;
          const regularUsers = users.filter((u) => !u.isAdmin).length;
          const recentUsersCount = users.filter(
            (u) => u.createdAt > thirtyDaysAgo
          ).length;

          // Usuários mais recentes (últimos 5)
          const sortedUsers = users
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            .slice(0, 5);

          setRecentUsers(sortedUsers);
          setStats((prev) => ({
            ...prev,
            totalUsers: users.length,
            adminUsers,
            regularUsers,
            recentUsers: recentUsersCount,
          }));
        }
        setLoading(false);
      });

      return () => {
        unsubscribeBases();
        unsubscribeUsers();
      };
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground">
            Visão geral do sistema e estatísticas gerais
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={() => navigate("/admin/gestao-bases")}
            className="flex items-center gap-2"
          >
            <Building2 size={16} />
            Gestão de Bases
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/gerenciar-usuarios-global")}
            className="flex items-center gap-2"
          >
            <Users size={16} />
            Gerenciar Usuários
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Bases"
          value={stats.totalBases}
          description="Bases criadas no sistema"
          icon={Database}
          trend={{
            value:
              Math.round((stats.recentBases / stats.totalBases) * 100) || 0,
            isPositive: true,
          }}
          badge={{ text: `${stats.recentBases} novas`, variant: "secondary" }}
        />

        <StatCard
          title="Bases Ativas"
          value={stats.activeBases}
          description={`${stats.inactiveBases} inativas`}
          icon={CheckCircle}
          badge={{
            text: `${
              Math.round((stats.activeBases / stats.totalBases) * 100) || 0
            }%`,
            variant:
              stats.activeBases > stats.inactiveBases
                ? "default"
                : "destructive",
          }}
        />

        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers}
          description="Usuários cadastrados"
          icon={Users}
          trend={{
            value:
              Math.round((stats.recentUsers / stats.totalUsers) * 100) || 0,
            isPositive: true,
          }}
          badge={{ text: `${stats.recentUsers} novos`, variant: "secondary" }}
        />

        <StatCard
          title="Administradores"
          value={stats.adminUsers}
          description={`${stats.regularUsers} usuários comuns`}
          icon={Shield}
          badge={{
            text: `${
              Math.round((stats.adminUsers / stats.totalUsers) * 100) || 0
            }%`,
            variant: "outline",
          }}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Bases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bases Recentes
            </CardTitle>
            <CardDescription>Últimas bases criadas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBases.length > 0 ? (
                recentBases.map((base) => (
                  <div
                    key={base.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          base.ativo ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {base.numberId ? `${base.numberId} - ` : ""}
                          {base.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(base.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={base.ativo ? "default" : "secondary"}>
                      {base.ativo ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {base.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma base encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Usuários Recentes
            </CardTitle>
            <CardDescription>Últimos usuários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length > 0 ? (
                recentUsers.map((user) => (
                  <div
                    key={user.uid}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          user.isAdmin
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {user.displayName?.charAt(0).toUpperCase() ||
                          user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.displayName || "Nome não informado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? (
                        <Shield className="h-3 w-3 mr-1" />
                      ) : (
                        <Users className="h-3 w-3 mr-1" />
                      )}
                      {user.isAdmin ? "Admin" : "Usuário"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum usuário encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades administrativas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate("/admin/gestao-bases")}
            >
              <Plus size={24} className="text-blue-600" />
              <span className="text-sm font-medium">Nova Base</span>
              <span className="text-xs text-muted-foreground">
                Criar base de dados
              </span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate("/admin/gestao-bases")}
            >
              <UserPlus size={24} className="text-green-600" />
              <span className="text-sm font-medium">Gerar Convite</span>
              <span className="text-xs text-muted-foreground">
                Convidar usuário
              </span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate("/admin/gestao-bases")}
            >
              <Eye size={24} className="text-purple-600" />
              <span className="text-sm font-medium">Ver Bases</span>
              <span className="text-xs text-muted-foreground">
                Gerenciar bases
              </span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={24} className="text-orange-600" />
              <span className="text-sm font-medium">Atualizar</span>
              <span className="text-xs text-muted-foreground">
                Recarregar dados
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      {stats.inactiveBases > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              Alertas do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                <XCircle className="h-4 w-4" />
                <span>
                  {stats.inactiveBases} base{stats.inactiveBases > 1 ? "s" : ""}{" "}
                  inativa{stats.inactiveBases > 1 ? "s" : ""} no sistema
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/admin/gestao-bases")}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-200 dark:border-yellow-700 dark:hover:bg-yellow-800/20"
              >
                Revisar Bases Inativas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status do Sistema
          </CardTitle>
          <CardDescription>Indicadores de saúde do sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Sistema Online</p>
                <p className="text-xs text-muted-foreground">
                  Todos os serviços funcionando
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <Database className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Banco de Dados</p>
                <p className="text-xs text-muted-foreground">
                  Conectado e sincronizado
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg border">
              <Shield className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Segurança</p>
                <p className="text-xs text-muted-foreground">
                  Autenticação ativa
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
