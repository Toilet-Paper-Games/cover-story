import { chromium } from "@playwright/test";

const productionUrl = process.env.TPG_PRODUCTION_URL ?? "https://play.tp.games/";
const expectedVersion = process.env.TPG_EXPECTED_VERSION ?? "0.1.6";
const focusableSelector =
  'button,a[href],input,select,textarea,summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"]),audio[controls],video[controls]';

const browser = await chromium.launch({ headless: true });
const contexts = [];

try {
  const hostContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  contexts.push(hostContext);
  const host = await hostContext.newPage();
  await host.goto(productionUrl, { waitUntil: "domcontentloaded" });

  const invite = host.getByRole("link", { name: /controller join link/i });
  await invite.waitFor();
  const joinUrl = await invite.getAttribute("href");
  if (!joinUrl) throw new Error("Production room did not expose a controller invite URL.");
  const roomCode = new URL(joinUrl).pathname.split("/")[2];

  const controllers = [];
  for (let index = 0; index < 3; index += 1) {
    const context = await browser.newContext({
      viewport: { width: index === 0 ? 360 : 430, height: index === 0 ? 740 : 860 },
      hasTouch: true,
      isMobile: true
    });
    contexts.push(context);
    const page = await context.newPage();
    await page.goto(joinUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Menu" }).waitFor();
    const nameGate = page.getByRole("heading", { name: "Enter name" });
    if (await nameGate.count()) {
      await page.getByRole("textbox", { name: "Screen name" }).fill(["Mara", "Nico", "Pip"][index]);
      await page.getByRole("button", { name: "Join room" }).click();
    }
    controllers.push(page);
  }

  await controllers[0].getByRole("heading", { name: "Cover Story" }).waitFor({ timeout: 20_000 });

  let authorityIndex = -1;
  for (let index = 0; index < controllers.length; index += 1) {
    const page = controllers[index];
    await page.getByRole("button", { name: "Menu" }).click();
    const menu = page.getByRole("dialog", { name: "Controller menu" });
    if ((await menu.textContent())?.includes("Organizer")) authorityIndex = index;
    await page.getByRole("button", { name: "Close controller menu" }).click();
  }
  if (authorityIndex < 0) throw new Error("No controller received shell-designated authority.");

  const authority = controllers[authorityIndex];
  await authority.getByRole("button", { name: "Open Cover Story details" }).click();
  await authority.getByRole("button", { name: "Play Cover Story" }).click();

  const controllerFrames = controllers.map((page) => page.frameLocator("iframe"));
  const hostFrame = host.frameLocator("iframe");
  await hostFrame.getByRole("heading", { name: "Make the unbelievable sound reasonable" }).waitFor({
    timeout: 20_000
  });

  const controllerAssetUrl = await controllers[0].locator("iframe").getAttribute("src");
  const hostAssetUrl = await host.locator("iframe").getAttribute("src");
  if (!controllerAssetUrl?.includes(`/cover-story/${expectedVersion}/controller.html`)) {
    throw new Error(`Expected controller ${expectedVersion}, received ${controllerAssetUrl ?? "no iframe"}.`);
  }
  if (!hostAssetUrl?.includes(`/cover-story/${expectedVersion}/host.html`)) {
    throw new Error(`Expected host ${expectedVersion}, received ${hostAssetUrl ?? "no iframe"}.`);
  }

  const authorityControlCounts = [];
  for (const frame of controllerFrames) {
    authorityControlCounts.push(await frame.getByText("Room director", { exact: true }).count());
  }
  if (authorityControlCounts.filter(Boolean).length !== 1 || authorityControlCounts[authorityIndex] !== 1) {
    throw new Error(`Authority controls leaked: ${authorityControlCounts.join(",")}.`);
  }

  for (const frame of controllerFrames) {
    await frame.getByRole("button", { name: "I’m ready" }).tap();
  }

  const covers = [
    "The mayor rerouted the pipes after pigeons stole his ceremonial sandwich.",
    "A wellness influencer ordered a broth fountain and forgot to specify the venue.",
    "The plumbing crew mistook the annual bisque permit for an infrastructure blueprint."
  ];
  for (let index = 0; index < controllerFrames.length; index += 1) {
    const frame = controllerFrames[index];
    const textbox = frame.getByRole("textbox", { name: "Your one-sentence cover" });
    await textbox.waitFor({ timeout: 25_000 });
    await textbox.fill(covers[index]);
    const submitCover = frame.getByRole("button", { name: "Lock in my cover" });
    await submitCover.press("Enter");
    try {
      await frame.getByRole("heading", { name: "Cover locked in" }).waitFor({ timeout: 10_000 });
    } catch {
      const controllerState = (await frame.locator("main").innerText()).replace(/\s+/g, " ").trim();
      throw new Error(`Controller ${index + 1} did not confirm its cover: ${controllerState}`);
    }
  }

  await controllerFrames[0]
    .getByRole("heading", { name: "What motivated this cover?" })
    .waitFor({ timeout: 20_000 });

  for (const frame of controllerFrames) {
    await frame.getByRole("heading", { name: "What motivated this cover?" }).waitFor();
    await frame.getByRole("radio").first().check();
    await frame.getByRole("button", { name: "Continue to favorite" }).press("Enter");
    await frame.getByRole("radio").first().check();
    await frame.getByRole("button", { name: "Submit my ballot" }).press("Enter");
  }

  await hostFrame.getByRole("heading", { name: "The truth comes out" }).waitFor({ timeout: 20_000 });
  const hostFocusableCount = await hostFrame.locator(focusableSelector).count();
  if (hostFocusableCount !== 0) {
    throw new Error(`Passive host contract failed with ${hostFocusableCount} focusable elements.`);
  }

  const controllerResults = [];
  for (const frame of controllerFrames) {
    await frame.getByText("Permanent record updated", { exact: true }).waitFor();
    controllerResults.push((await frame.locator("main").innerText()).replace(/\s+/g, " ").trim());
  }

  const hostResult = (await hostFrame.locator("main").innerText()).replace(/\s+/g, " ").trim();
  const screenshotPath = `output/production-${roomCode}-${expectedVersion}.png`;
  await host.screenshot({ path: screenshotPath, fullPage: true });

  console.log(
    JSON.stringify(
      {
        roomCode,
        expectedVersion,
        controllerAssetUrl,
        hostAssetUrl,
        authorityIndex,
        authorityControlCounts,
        submittedCovers: covers.length,
        submittedBallots: controllerFrames.length,
        hostFocusableCount,
        hostResult,
        controllerResults,
        screenshotPath
      },
      null,
      2
    )
  );
} finally {
  await Promise.all(contexts.map((context) => context.close().catch(() => undefined)));
  await browser.close();
}
