import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// theknightedjobs.com is also pointed at this deployment. A path-based proxy
// routes "/" to this static serve for ALL hosts, so KJ domain visitors would
// land here and see the Resume app. Redirect them to the KJ app before React
// mounts to avoid a flash of wrong content.
if (
  typeof window !== "undefined" &&
  window.location.hostname === "theknightedjobs.com" &&
  !window.location.pathname.startsWith("/knighted-jobs")
) {
  window.location.replace("/knighted-jobs/");
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
