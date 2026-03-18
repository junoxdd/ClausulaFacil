import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let errorDetails = "";

      if (this.state.error?.message) {
        try {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error && parsedError.operationType) {
            errorMessage = "Erro de permissão no banco de dados.";
            errorDetails = `Não foi possível realizar a operação (${parsedError.operationType}) no caminho: ${parsedError.path}. Detalhes: ${parsedError.error}`;
          } else {
            errorDetails = this.state.error.message;
          }
        } catch (e) {
          errorDetails = this.state.error.message;
        }
      }

      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado.</h1>
            <p className="text-gray-600 mb-6 font-secondary">{errorMessage}</p>
            {errorDetails && (
              <div className="bg-gray-50 p-4 rounded-xl text-left border border-gray-200 mb-6 overflow-auto max-h-48">
                <p className="text-sm text-gray-700 font-mono break-words">{errorDetails}</p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
