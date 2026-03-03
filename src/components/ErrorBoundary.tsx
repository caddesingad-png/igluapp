import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-6">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="font-display text-[20px] font-normal text-foreground mb-3">
            Algo deu errado
          </h2>
          <p className="font-body font-light text-[14px] text-muted-foreground leading-relaxed max-w-[280px] mb-6">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <Button onClick={this.handleRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Tentar novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
