import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Store } from "@/types/store";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "./ImageUpload";
import { maskCNPJ, onlyNumbers } from "@/utils/formatters";
import { Star } from "lucide-react"; // Ícone de estrela

interface StoreManagerProps {
  stores: Store[];
  onAddStore: (store: Omit<Store, "id" | "createdAt">) => void;
  onUpdateStore: (id: string, store: Partial<Store>) => void;
  onDeleteStore: (id: string) => void;
}

export const StoreManager = ({
  stores,
  onAddStore,
  onUpdateStore,
  onDeleteStore,
}: StoreManagerProps) => {
  const [newStore, setNewStore] = useState({
    name: "",
    cnpj: "",
    nickname: "",
    code: "",
    icon: "", // Remover valor padrão
    isDefault: false,
  });

  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [displayCNPJ, setDisplayCNPJ] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (newStore.cnpj) {
      setDisplayCNPJ(maskCNPJ(newStore.cnpj));
    }
  }, [newStore.cnpj]);

  useEffect(() => {
    if (editingStore) {
      setDisplayCNPJ(maskCNPJ(editingStore.cnpj));
    }
  }, [editingStore?.cnpj]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStore.name.trim() || !newStore.cnpj.trim()) {
      toast({
        title: "Erro",
        description: "Nome e CNPJ são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    onAddStore({
      name: newStore.name,
      cnpj: onlyNumbers(newStore.cnpj),
      nickname: newStore.nickname || null, // Alterado para null
      code: newStore.code || null, // Alterado para null
      icon: newStore.icon, // Enviar o ícone (string ou URL)
      isDefault: newStore.isDefault,
    });

    setNewStore({
      name: "",
      cnpj: "",
      nickname: "",
      code: "",
      icon: "", // Resetar para string vazia
      isDefault: false,
    });
    setDisplayCNPJ("");

    toast({
      title: "Sucesso!",
      description: "Loja cadastrada com sucesso!",
      variant: "success",
    });
  };

  const handleUpdate = () => {
    if (!editingStore) return;

    if (!editingStore.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    onUpdateStore(editingStore.id, {
      name: editingStore.name,
      nickname: editingStore.nickname || null, // Alterado para null
      code: editingStore.code || null, // Alterado para null
      icon: editingStore.icon,
      isDefault: editingStore.isDefault,
    });

    setEditingStore(null);

    toast({
      title: "Sucesso",
      description: "Loja atualizada com sucesso!",
      variant: "success",
    });
  };

  const handleDelete = (id: string, name: string) => {
    onDeleteStore(id);
    toast({
      title: "Loja removida",
      description: `"${name}" foi removida com sucesso.`,
      variant: "success",
    });
  };

  const handleCNPJChange = (value: string) => {
    const cleanCNPJ = onlyNumbers(value);
    setNewStore((prev) => ({ ...prev, cnpj: cleanCNPJ }));
    setDisplayCNPJ(maskCNPJ(cleanCNPJ));
  };

  const handleToggleDefault = (storeId: string) => {
    const currentStore = stores.find((s) => s.id === storeId);
    if (!currentStore) return;

    const newIsDefault = !currentStore.isDefault;

    // Se está marcando como padrão, desmarca qualquer outra que seja padrão
    if (newIsDefault) {
      stores.forEach((s) => {
        if (s.isDefault && s.id !== storeId) {
          onUpdateStore(s.id, { ...s, isDefault: false });
        }
      });
    }
    onUpdateStore(storeId, { ...currentStore, isDefault: newIsDefault });
    toast({
      title: newIsDefault
        ? "Loja definida como padrão"
        : "Loja não é mais padrão",
    });
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏪 Gerenciar Lojas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form to add new store */}
        {!editingStore ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Loja *</Label>
                <Input
                  id="name"
                  value={newStore.name}
                  onChange={(e) =>
                    setNewStore((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Loja Centro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={displayCNPJ}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  required
                  maxLength={18}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nickname">Apelido</Label>
                <Input
                  id="nickname"
                  value={newStore.nickname}
                  onChange={(e) =>
                    setNewStore((prev) => ({
                      ...prev,
                      nickname: e.target.value,
                    }))
                  }
                  placeholder="Ex: Centro"
                />
              </div>

              <div>
                <Label htmlFor="code">Código da Loja</Label>
                <Input
                  id="code"
                  value={newStore.code}
                  onChange={(e) =>
                    setNewStore((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Ex: 001"
                />
              </div>
            </div>

            <ImageUpload
              currentIcon={newStore.icon} // Passar o ícone atual (string ou URL)
              onIconChange={(icon) =>
                setNewStore((prev) => ({ ...prev, icon }))
              }
              placeholder="Ícone da Loja"
            />

            <Button type="submit" className="w-full">
              Cadastrar Loja
            </Button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}
            className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-blue-800">Editando Loja</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingStore(null)}
              >
                Cancelar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nome da Loja *</Label>
                <Input
                  id="edit-name"
                  value={editingStore.name}
                  onChange={(e) =>
                    setEditingStore({ ...editingStore, name: e.target.value })
                  }
                  placeholder="Ex: Loja Centro"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-cnpj">CNPJ (não editável)</Label>
                <Input id="edit-cnpj" value={displayCNPJ} disabled />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nickname">Apelido</Label>
                <Input
                  id="edit-nickname"
                  value={editingStore.nickname || ""}
                  onChange={(e) =>
                    setEditingStore({
                      ...editingStore,
                      nickname: e.target.value,
                    })
                  }
                  placeholder="Ex: Centro"
                />
              </div>

              <div>
                <Label htmlFor="edit-code">Código da Loja</Label>
                <Input
                  id="edit-code"
                  value={editingStore.code || ""}
                  onChange={(e) =>
                    setEditingStore({ ...editingStore, code: e.target.value })
                  }
                  placeholder="Ex: 001"
                />
              </div>
            </div>

            <ImageUpload
              currentIcon={editingStore.icon} // Passar o ícone atual (string ou URL)
              onIconChange={(icon) =>
                setEditingStore({ ...editingStore, icon })
              }
              currentIsDefault={editingStore.isDefault} // Passar o estado de isDefault
              placeholder="Ícone da Loja"
            />

            <Button type="submit" className="w-full">
              Salvar Alterações
            </Button>
          </form>
        )}

        {/* Stores list */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Lojas Cadastradas</h4>
          <div className="space-y-3">
            {stores.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma loja cadastrada
              </p>
            ) : (
              stores.map((store) => (
                <div
                  key={store.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    {store.icon &&
                    (store.icon.startsWith("data:image") ||
                      store.icon.startsWith("http")) ? (
                      <img
                        src={store.icon}
                        alt={store.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                        {store.icon || "🏪"}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{store.name}</p>
                        {store.nickname && (
                          <Badge variant="secondary" className="text-xs">
                            {store.nickname}
                          </Badge>
                        )}
                        {store.code && (
                          <Badge variant="outline" className="text-xs">
                            #{store.code}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {maskCNPJ(store.cnpj)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleDefault(store.id)}
                      className={`p-1 h-8 w-8 transition-all duration-200 ease-in-out transform hover:scale-125 ${
                        store.isDefault
                          ? "text-yellow-400"
                          : "text-gray-400 hover:text-yellow-300"
                      }`}
                      title={
                        store.isDefault
                          ? "Remover como padrão"
                          : "Marcar como padrão"
                      }
                    >
                      <Star
                        fill={store.isDefault ? "currentColor" : "none"}
                        className={store.isDefault ? "animate-pulse-star" : ""}
                      />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingStore(store)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(store.id, store.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
