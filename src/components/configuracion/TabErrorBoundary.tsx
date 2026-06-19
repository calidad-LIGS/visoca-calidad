import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props { children: ReactNode; tab: string; }
interface State { hasError: boolean; error: string; }

export class TabErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error) {
    console.error(`[${this.props.tab}] Tab error:`, error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[30vh] p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-warning mb-2" />
          <h3 className="font-display text-base font-semibold text-foreground">
            Error al cargar {this.props.tab}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{this.state.error}</p>
          <Button className="mt-4" onClick={() => this.setState({ hasError: false, error: "" })}>
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
