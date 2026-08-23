import "./presentation/styles.css";

import { ControllerSurfaceRenderer } from "./presentation/controllerSurface";
import { PublicSurfaceRenderer } from "./presentation/publicSurface";
import { scenarioSnapshot, stateFactories, type ScenarioName } from "./testing/fixtures";
import { staticCoordinator } from "./testing/scenarios";

const params = new URLSearchParams(location.search);
const requested = params.get("scenario") as ScenarioName | null;
const scenario: ScenarioName = requested && requested in stateFactories ? requested : "lobby";
const surface = params.get("surface") === "controller" ? "controller" : params.get("surface") === "spectator" ? "spectator" : "host";
const count = Math.min(8, Math.max(3, Number(params.get("players") ?? 5)));
const authority = params.get("authority") !== "0";

const nav = document.getElementById("gallery-nav");
const root = document.getElementById("app");
if (!nav || !root) throw new Error("Scenario gallery roots are missing.");

nav.innerHTML = params.get("nav") === "0" ? "" : `<nav style="position:fixed;z-index:20;top:8px;left:8px;display:flex;flex-wrap:wrap;gap:4px;max-width:calc(100% - 16px)">${Object.keys(stateFactories).map((name) => `<a style="background:#fff;border:1px solid #15161a;padding:4px 7px;color:#15161a;font:700 11px system-ui" href="?scenario=${name}&surface=${surface}&players=${count}&authority=${authority ? 1 : 0}">${name}</a>`).join("")}</nav>`;

if (surface === "controller") {
  const renderer = new ControllerSurfaceRenderer(root);
  const snapshot = scenarioSnapshot(scenario, { count, surface: "controller", authority });
  applyLongContent(snapshot);
  renderer.connect(staticCoordinator(snapshot));
} else {
  const kind = surface === "spectator" ? "spectator" : "host-display";
  const renderer = new PublicSurfaceRenderer(root, surface);
  const snapshot = scenarioSnapshot(scenario, { count, surface: kind });
  applyLongContent(snapshot);
  renderer.connect(staticCoordinator(snapshot));
}

function applyLongContent(snapshot: ReturnType<typeof scenarioSnapshot>) {
  if (params.get("long") !== "1" || !snapshot.state?.lastRoundResults) return;
  const longCover = (index: number) =>
    (`A meticulously detailed official explanation number ${index + 1} involving paperwork, witnesses, weather balloons, snacks, and one very patient llama. `.repeat(2)).slice(0, 140);
  snapshot.state = {
    ...snapshot.state,
    roster: snapshot.state.roster.map((player, index) => ({
      ...player,
      name: `${player.name} Longlastname ${index + 1}`
    })),
    lastRoundResults: {
      ...snapshot.state.lastRoundResults,
      answers: snapshot.state.lastRoundResults.answers.map((answer, index) => ({
        ...answer,
        authorName: `${answer.authorName} Longlastname ${index + 1}`,
        text: longCover(index)
      }))
    }
  };
}
