import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const container = document.getElementById("app");
if (!container) {
  throw new Error("bug: not found app element");
}
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
