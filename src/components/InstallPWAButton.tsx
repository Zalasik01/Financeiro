import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DownloadCloud } from "lucide-react"; // Ícone para o botão

// Define a interface para o evento beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Previne o mini-infobar do Chrome de aparecer
      setDeferredPrompt(e as BeforeInstallPromptEvent); // Salva o evento para ser usado depois
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Verifica se é iOS para mostrar instruções específicas
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    // @ts-ignore: Property 'standalone' does not exist on type 'Navigator'.
    const isInStandaloneMode =
      window.navigator.standalone ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && !isInStandaloneMode) {
      setShowIOSInstructions(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // Mostra o prompt de instalação
    const { outcome } = await deferredPrompt.userChoice; // Espera o usuário responder
    console.log(`Resposta do usuário ao prompt de instalação: ${outcome}`);
    setDeferredPrompt(null); // O prompt só pode ser usado uma vez
    setShowIOSInstructions(false); // Esconde as instruções do iOS se o prompt foi mostrado (improvável no iOS, mas por segurança)
  };

  if (showIOSInstructions && !deferredPrompt) {
    return (
      <div className="text-xs text-gray-300 p-1 text-center bg-gray-700 rounded-md">
        Para instalar no iOS: Toque em{" "}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="currentColor"
          className="bi bi-box-arrow-up inline-block mx-1"
          viewBox="0 0 16 16"
        >
          <path
            fillRule="evenodd"
            d="M3.5 6a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5h-2a.5.5 0 0 1 0-1h2A1.5 1.5 0 0 1 14 6.5v8A1.5 1.5 0 0 1 12.5 16h-9A1.5 1.5 0 0 1 2 14.5v-8A1.5 1.5 0 0 1 3.5 5h2a.5.5 0 0 1 0 1z"
          />
          <path
            fillRule="evenodd"
            d="M7.646.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 1.707V10.5a.5.5 0 0 1-1 0V1.707L5.354 3.854a.5.5 0 1 1-.708-.708z"
          />
        </svg>
        e "Adicionar à Tela de Início".
      </div>
    );
  }

  if (!deferredPrompt) {
    return null; // Não mostra o botão se o app não puder ser instalado ou já estiver instalado
  }

  return (
    <Button
      variant="outline"
      onClick={handleInstallClick}
      className="px-3 py-2 rounded-md text-sm font-medium text-green-400 hover:bg-gray-700 hover:text-green-300 border-green-400 hover:border-green-300 flex items-center gap-2"
    >
      <DownloadCloud size={18} />
      Instalar App
    </Button>
  );
};
