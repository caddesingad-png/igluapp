import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { applyPlatformAttr } from "./hooks/usePlatform";
import "./index.css";

applyPlatformAttr();

createRoot(document.getElementById("root")!).render(<App />);
