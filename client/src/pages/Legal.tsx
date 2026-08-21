import { SiteShell } from "@/components/SiteShell";
import { Seo } from "@/components/Seo";

export default function Legal({ type }: { type: "privacy" | "terms" }) {
  const privacy = type === "privacy";
  const title = privacy ? "Privacy that stays practical." : "Terms in plain language.";
  const path = privacy ? "/privacy" : "/terms";
  const description = privacy
    ? "Read how ToolImage processes images locally in your browser and handles service information."
    : "Read the terms that govern ToolImage’s browser-local image utilities.";
  const seoTitle = privacy ? "ToolImage Privacy Policy | Local Image Processing" : "ToolImage Terms of Service | Browser-Local Image Tools";
  return <SiteShell><Seo title={seoTitle} description={description} path={path} /><main id="main-content"><article className="legal-page"><p className="eyebrow">TOOLIMAGE / {privacy ? "PRIVACY" : "TERMS"}</p><h1>{title}</h1>{privacy ? <><h2>Local processing</h2><p>ToolImage is designed to process images in your browser. When you compress, resize, or convert a supported image, the file is handled by your device rather than being uploaded to a ToolImage image-processing server.</p><h2>Information we do not collect</h2><p>ToolImage does not collect the contents of images processed through its local tools. If analytics are introduced in the future, they will be limited to anonymized product events such as a completed compression, not image content.</p><h2>Contact</h2><p>For privacy questions, contact <a href="mailto:support@toolimage.online">support@toolimage.online</a>.</p></> : <><h2>Using the tools</h2><p>You are responsible for ensuring you have the rights to process and use the images you select. ToolImage is provided as an image utility and should be used with supported, lawful files.</p><h2>No guaranteed target</h2><p>Image content, format, and browser capabilities affect compression results. A selected target size is a request, and ToolImage may return the closest practical result when meeting that size would overly reduce quality.</p><h2>Availability</h2><p>ToolImage is provided without a guarantee of uninterrupted availability or support for every browser, image format, or device. We aim to keep the local tools reliable and clear about their capabilities.</p></>}</article></main></SiteShell>;
}
