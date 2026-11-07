import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Human-readable name for the section being guarded. */
  sectionName: string;
  /** Custom fallback renderer; receives a reset callback. */
  fallback?: (reset: () => void, error: Error) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Error boundary that keeps a failure inside one view from taking down the
 * whole shell. Class components are still the only way to catch render errors.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production this would report to the observability pipeline.
    console.error(`[GRANTLY] ${this.props.sectionName} crashed:`, error, info.componentStack);
  }

  private readonly reset = (): void => {
    this.setState({ error: null });
  };

  public render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback(this.reset, error);

    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-4 rounded-xl border border-danger/30 bg-danger/5 px-6 py-12 text-center"
      >
        <span className="grid size-12 place-items-center rounded-full bg-danger/12 text-danger" aria-hidden="true">
          <AlertTriangle className="size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">
            {this.props.sectionName} failed to load
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Something went wrong while rendering this section. Your saved data is safe — try again.
          </p>
        </div>
        <Button variant="outline" size="sm" leftIcon={<RotateCcw />} onClick={this.reset}>
          Try again
        </Button>
      </div>
    );
  }
}
