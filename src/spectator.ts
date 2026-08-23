import "./presentation/styles.css";

import { PublicSurfaceRenderer } from "./presentation/publicSurface";
import { bootSurface } from "./platform/bootSurface";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app spectator surface root.");

bootSurface("spectator", "spectator", new PublicSurfaceRenderer(root, "spectator"));
