import React from "react";
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from "lucide-react";
import { toast as baseToast } from "@/hooks/use-toast";

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: React.ReactNode;
}

// Função auxiliar para criar toasts com ícones e estilos consistentes
const createToast = (
  variant: "success" | "destructive" | "warning" | "info" | "default",
  icon: React.ReactNode,
  options: ToastOptions
) => {
  return baseToast({
    variant,
    title: (
      <div className="flex items-center gap-2">
        {icon}
        <span>{options.title}</span>
      </div>
    ),
    description: options.description,
    duration: options.duration || 4000,
    action: options.action,
  });
};

// Toasts melhorados com ícones e animações
export const toast = {
  // Toast de sucesso
  success: (options: ToastOptions) => {
    return createToast(
      "success",
      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />,
      {
        ...options,
        title: options.title || "Sucesso!",
      }
    );
  },

  // Toast de erro
  error: (options: ToastOptions) => {
    return createToast(
      "destructive",
      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />,
      {
        ...options,
        title: options.title || "Erro!",
        duration: options.duration || 6000, // Erros ficam mais tempo
      }
    );
  },

  // Toast de aviso
  warning: (options: ToastOptions) => {
    return createToast(
      "warning",
      <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
      {
        ...options,
        title: options.title || "Atenção!",
      }
    );
  },

  // Toast informativo
  info: (options: ToastOptions) => {
    return createToast(
      "info",
      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      {
        ...options,
        title: options.title || "Informação",
      }
    );
  },

  // Toast de carregamento
  loading: (options: ToastOptions) => {
    return createToast(
      "default",
      <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-400" />,
      {
        ...options,
        title: options.title || "Carregando...",
        duration: options.duration || 0, // Loading não desaparece automaticamente
      }
    );
  },

  // Toast personalizado (mantém compatibilidade)
  custom: baseToast,

  // Funções de conveniência para casos comuns
  saveSuccess: (itemName: string = "item") => {
    return toast.success({
      title: "Salvo com sucesso!",
      description: `${itemName} foi salvo com sucesso.`,
    });
  },

  saveError: (error?: string) => {
    return toast.error({
      title: "Erro ao salvar",
      description: error || "Ocorreu um erro inesperado. Tente novamente.",
    });
  },

  deleteSuccess: (itemName: string = "item") => {
    return toast.success({
      title: "Excluído com sucesso!",
      description: `${itemName} foi excluído com sucesso.`,
    });
  },

  deleteError: (error?: string) => {
    return toast.error({
      title: "Erro ao excluir",
      description: error || "Não foi possível excluir o item. Tente novamente.",
    });
  },

  createSuccess: (itemName: string = "item") => {
    return toast.success({
      title: "Criado com sucesso!",
      description: `${itemName} foi criado com sucesso.`,
    });
  },

  createError: (error?: string) => {
    return toast.error({
      title: "Erro ao criar",
      description: error || "Não foi possível criar o item. Tente novamente.",
    });
  },

  updateSuccess: (itemName: string = "item") => {
    return toast.success({
      title: "Atualizado com sucesso!",
      description: `${itemName} foi atualizado com sucesso.`,
    });
  },

  updateError: (error?: string) => {
    return toast.error({
      title: "Erro ao atualizar",
      description:
        error || "Não foi possível atualizar o item. Tente novamente.",
    });
  },

  copySuccess: (content: string = "Conteúdo") => {
    return toast.success({
      title: "Copiado!",
      description: `${content} copiado para a área de transferência.`,
      duration: 2000,
    });
  },

  permissionError: () => {
    return toast.error({
      title: "Sem permissão",
      description: "Você não tem permissão para realizar esta ação.",
    });
  },

  validationError: (message: string) => {
    return toast.warning({
      title: "Dados inválidos",
      description: message,
    });
  },

  networkError: () => {
    return toast.error({
      title: "Erro de conexão",
      description: "Verifique sua conexão com a internet e tente novamente.",
    });
  },
};
