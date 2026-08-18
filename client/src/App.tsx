/** ToolImage application routes — Monochrome Instrument: focused utilities with direct escape routes. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import ToolPage from "./pages/ToolPage";
import Pricing from "./pages/Pricing";
import Legal from "./pages/Legal";
import NotFound from "./pages/NotFound";

function Router() { return <Switch>
  <Route path="/" component={Home} />
  <Route path="/compress-image" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-jpg" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-png" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-webp" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-image-to-20kb" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-image-to-50kb" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-image-to-100kb" component={() => <ToolPage mode="compress" />} />
  <Route path="/compress-image-to-200kb" component={() => <ToolPage mode="compress" />} />
  <Route path="/resize-image" component={() => <ToolPage mode="resize" />} />
  <Route path="/convert-image" component={() => <ToolPage mode="convert" />} />
  <Route path="/pricing" component={Pricing} />
  <Route path="/privacy" component={() => <Legal type="privacy" />} />
  <Route path="/terms" component={() => <Legal type="terms" />} />
  <Route component={NotFound} />
</Switch>; }

export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
