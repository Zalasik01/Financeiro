import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Em produção, enviar erro para serviço de logging
    if (import.meta.env.PROD) {
      // TODO: Implementar envio para Sentry, LogRocket, etc.
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({
  error,
  resetError,
}) => {
  const [copied, setCopied] = useState(false);

  const copyErrorToClipboard = async () => {
    const errorText = `Erro: ${error.message}\n\nStack Trace:\n${error.stack || 'Não disponível'}`;
    
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (copyErr) {
        console.error('Erro ao copiar:', copyErr);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <CardTitle>Oops! Algo deu errado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          {import.meta.env.DEV && (
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer flex items-center justify-between">
                <span>Detalhes técnicos</span>
                <Button
                  onClick={copyErrorToClipboard}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  title="Copiar erro"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {error.message}
                {error.stack && '\n' + error.stack}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline" className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
