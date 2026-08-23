import "./presentation/styles.css";

import { ControllerSurfaceRenderer } from "./presentation/controllerSurface";
import { bootSurface } from "./platform/bootSurface";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app controller surface root.");

bootSurface("controller", "controller", new ControllerSurfaceRenderer(root));
