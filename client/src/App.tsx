/** ToolImage routes — standalone local-first utilities with indexable task-specific pages and no account flow. */
/** ToolImage routes — retain direct access to the local tools while providing genuine navigation destinations for product exploration. */
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { EntitlementProvider } from "./contexts/EntitlementContext";
import { SEO_PAGES } from "./lib/seo";
const Home = lazy(() => import("./pages/Home"));
const ToolPage = lazy(() => import("./pages/ToolPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Legal = lazy(() => import("./pages/Legal"));
const Tools = lazy(() => import("./pages/Tools"));
const About = lazy(() => import("./pages/About"));
const Batch = lazy(() => import("./pages/Batch"));
const NotFound = lazy(() => import("./pages/NotFound"));
function Router() { return <Suspense fallback={<main className="route-loading"><span className="eyebrow">TOOLIMAGE / PREPARING YOUR WORKSPACE</span></main>}><Switch><Route path="/" component={Home} /><Route path="/compress-image" component={() => <ToolPage mode="compress" />} /><Route path="/compress-jpg" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compressJpg} />} /><Route path="/compress-png" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compressPng} />} /><Route path="/compress-webp" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compressWebp} />} /><Route path="/compress-image-to-20kb" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compress20kb} />} /><Route path="/compress-image-to-50kb" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compress50kb} />} /><Route path="/compress-image-to-100kb" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compress100kb} />} /><Route path="/compress-image-to-200kb" component={() => <ToolPage mode="compress" seo={SEO_PAGES.compress200kb} />} /><Route path="/resize-image" component={() => <ToolPage mode="resize" />} /><Route path="/convert-image" component={() => <ToolPage mode="convert" />} /><Route path="/tools" component={Tools} /><Route path="/batch" component={Batch} /><Route path="/pricing" component={Pricing} /><Route path="/about" component={About} /><Route path="/privacy" component={() => <Legal type="privacy" />} /><Route path="/terms" component={() => <Legal type="terms" />} /><Route component={NotFound} /></Switch></Suspense>; }
export default function App() { return <ErrorBoundary><EntitlementProvider><Router /></EntitlementProvider></ErrorBoundary>; }
