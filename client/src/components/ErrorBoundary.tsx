/** ToolImage error boundary — calm recovery messaging that never exposes internal stack traces to users. */
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
interface Props { children: ReactNode; } interface State { hasError: boolean; }
class ErrorBoundary extends Component<Props, State> { constructor(props: Props) { super(props); this.state = { hasError: false }; } static getDerivedStateFromError(): State { return { hasError: true }; } render() { if (this.state.hasError) return <main className="app-error" role="alert"><AlertTriangle size={37} /><p className="eyebrow">TOOLIMAGE / RECOVERY</p><h1>That workspace<br /><em>lost its place.</em></h1><p>Refresh the page and choose your image again. Your files are never uploaded or stored by ToolImage.</p><button type="button" className="primary-button" onClick={() => window.location.reload()}><RotateCcw size={16} /> Refresh ToolImage</button></main>; return this.props.children; } }
export default ErrorBoundary;
