import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a2e",
          color: "#fff",
          padding: "20px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif"
        }}>
          <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>حدث خطأ</h1>
          <p style={{ color: "#888", marginBottom: "16px" }}>
            {this.state.error?.message || "خطأ غير معروف"}
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px",
              backgroundColor: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
