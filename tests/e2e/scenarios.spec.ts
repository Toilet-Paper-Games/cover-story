import { expect, test, type Frame } from "@playwright/test";

const focusableSelector =
  'button,a[href],input,select,textarea,summary,[contenteditable="true"],[tabindex]:not([tabindex="-1"]),audio[controls],video[controls],iframe';

test("host and spectator scenario surfaces stay passive in every major phase", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const scenarios = [
    "lobby",
    "instructions",
    "roundIntro",
    "writing",
    "waiting",
    "voting",
    "results",
    "nextRound",
    "reconnect",
    "finale"
  ];

  for (const surface of ["host", "spectator"]) {
    for (const scenario of scenarios) {
      await page.goto(`/surfaces/gallery.html?scenario=${scenario}&surface=${surface}&players=8&nav=0`);
      await expect(page.locator("main")).toBeVisible();
      expect(await page.locator(focusableSelector).count(), `${surface}/${scenario}`).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${surface}/${scenario} horizontal overflow`
      ).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight),
        `${surface}/${scenario} vertical overflow on passive display`
      ).toBe(true);
    }
  }

  await page.setViewportSize({ width: 1280, height: 720 });
  for (const scenario of ["instructions", "finale"]) {
    await page.goto(`/surfaces/gallery.html?scenario=${scenario}&surface=host&players=8&nav=0`);
    expect(await page.locator(focusableSelector).count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
  }
  await page.goto("/surfaces/gallery.html?scenario=results&surface=host&players=8&long=1&nav=0");
  await expect(page.getByText("Answers 1–4 of 8")).toBeVisible();
  await page.locator(".answer-card").last().evaluate((card) =>
    Promise.all(card.getAnimations().map((animation) => animation.finished))
  );
  expect(
    await page.locator(".answer-wall").evaluate((wall) => {
      const boundary = wall.getBoundingClientRect();
      return (
        wall.scrollHeight <= wall.clientHeight &&
        [...wall.querySelectorAll(".answer-card")].every((card) => {
          const box = card.getBoundingClientRect();
          return box.top >= boundary.top && box.bottom <= boundary.bottom && box.bottom <= innerHeight;
        })
      );
    })
  ).toBe(true);
  await expect(page.getByText("Answers 5–8 of 8")).toBeVisible({ timeout: 9_000 });
});

test("narrow controllers render independent states and never leak authority controls", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const scenario of ["writing", "waiting", "voting", "results", "reconnect", "finale"]) {
    await page.goto(`/surfaces/gallery.html?scenario=${scenario}&surface=controller&players=8&authority=0&nav=0`);
    await expect(page.locator("main")).toBeVisible();
    expect(await page.locator("[data-action='lobby'],[data-action='settings'],.authority-badge").count()).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }

  await page.goto("/surfaces/gallery.html?scenario=reconnect&surface=controller&players=8&authority=0&nav=0");
  await expect(page.getByRole("heading", { name: "Holding your place" })).toBeVisible();
  await expect(page.locator("textarea,button,input")).toHaveCount(0);

  await page.goto("/surfaces/gallery.html?scenario=writing&surface=controller&players=8&authority=0&nav=0");
  await expect(page.getByRole("button", { name: "Lock in my cover" })).toBeInViewport();

  await page.goto("/surfaces/gallery.html?scenario=voting&surface=controller&players=8&authority=0&nav=0");
  await expect(page.getByRole("button", { name: "Continue to favorite" })).toBeInViewport();
  await expect(page.locator("input[name='angleGuessId']")).toHaveCount(3);
  await expect(page.locator("input[name='favoriteAnswerId']")).toHaveCount(0);
  await page.locator("input[name='angleGuessId']").first().check();
  await page.getByRole("button", { name: "Continue to favorite" }).click();
  await expect(page.locator("input[name='favoriteAnswerId']")).toHaveCount(3);
  await expect(page.getByText("Cover unavailable")).toHaveCount(0);

  await page.goto("/surfaces/gallery.html?scenario=finale&surface=controller&players=5&authority=1&nav=0");
  await expect(page.getByRole("button", { name: "Return everyone to lobby" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Room settings" })).toBeVisible();

  await page.goto("/surfaces/gallery.html?scenario=results&surface=controller&players=5&authority=0&nav=0");
  await expect(page.getByText("Correct decode", { exact: true })).toBeVisible();
  await expect(page.getByText(/this round/)).toBeVisible();
});

test("four Workbench controllers complete a round through controller authority", async ({ page }) => {
  test.setTimeout(600_000);
  await page.goto("/__tpg/workbench");
  await expect(page.getByRole("heading", { name: "Cover Story" })).toBeVisible();
  await expect.poll(() => controllerFrames(page.frames()).length).toBe(4);
  const initialHost = page.frames().find((frame) => frame.url().includes("/surfaces/host.html"))!;
  expect(await initialHost.locator("img.yearbook-art").evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);

  const participantCards = page.locator("aside article");
  await participantCards.nth(1).getByRole("button", { name: "Make authority" }).press("Enter");
  await page.getByRole("combobox", { name: "Lifecycle state" }).selectOption("started");

  let controllers = controllerFrames(page.frames());
  await Promise.all(
    controllers.map(async (frame) => {
      const acknowledgement = frame.locator("[data-action='ack']");
      const writing = frame.locator("[data-form='cover']");
      await acknowledgement.waitFor();
      await Promise.race([
        acknowledgement.press("Enter").catch(() => undefined),
        writing.waitFor().catch(() => undefined)
      ]);
    })
  );

  await Promise.all(controllers.map((frame) => frame.locator("[data-form='cover']").waitFor()));
  controllers = controllerFrames(page.frames());
  const covers = [
    "The night shift briefly misplaced a very large lamp.",
    "It was an approved darkness rehearsal for one extremely shy owl.",
    "The sky needed eleven quiet minutes to update its group photo.",
    "A coupon emergency required unusually dramatic astronomical measures."
  ];
  await controllers[1]!.locator("textarea").fill("A draft that must survive another player's echo");
  await controllers[1]!.locator("textarea").evaluate((textarea: HTMLTextAreaElement) => {
    textarea.focus();
    textarea.setSelectionRange(12, 12);
  });
  await controllers[0]!.locator("textarea").fill(covers[0]!);
  await controllers[0]!.getByRole("button", { name: "Lock in my cover" }).press("Enter");
  await expect(controllers[0]!.getByRole("heading", { name: "Cover locked in" })).toBeVisible();
  await expect(controllers[1]!.locator("textarea")).toHaveValue("A draft that must survive another player's echo");
  for (const [offset, frame] of controllers.slice(1).entries()) {
    await frame.locator("textarea").fill(covers[offset + 1]!);
    await frame.getByRole("button", { name: "Lock in my cover" }).press("Enter");
  }

  await Promise.all(controllers.map((frame) => frame.locator("[data-form='decode']").waitFor()));
  for (const frame of controllers) {
    await frame.locator("input[name='angleGuessId']").first().press("Space");
    await frame.getByRole("button", { name: "Continue to favorite" }).press("Enter");
  }
  controllers = controllerFrames(page.frames());
  await Promise.all(controllers.map((frame) => frame.locator("[data-form='ballot']").waitFor()));
  controllers = controllerFrames(page.frames());
  const host = page.frames().find((frame) => frame.url().includes("/surfaces/host.html"))!;
  const spectator = page.frames().find((frame) => frame.url().includes("/surfaces/spectator.html"))!;
  expect(await host.locator(focusableSelector).count()).toBe(0);
  expect(await spectator.locator(focusableSelector).count()).toBe(0);

  await controllers[1]!.locator("input[name='favoriteAnswerId']").first().press("Space");
  await controllers[0]!.locator("input[name='favoriteAnswerId']").first().press("Space");
  await controllers[0]!.getByRole("button", { name: "Submit my ballot" }).press("Enter");
  await expect(controllers[0]!.getByRole("heading", { name: "Ballot submitted" })).toBeVisible();
  await expect(controllers[1]!.locator("input[name='favoriteAnswerId']:checked")).toHaveCount(1);
  for (const frame of controllers.slice(1)) {
    await frame.locator("input[name='favoriteAnswerId']").first().press("Space");
    await frame.getByRole("button", { name: "Submit my ballot" }).press("Enter");
  }

  await expect(host.getByRole("heading", { name: "The truth comes out" })).toBeVisible();
  controllers = controllerFrames(page.frames());
  await expect(host.locator(".answer-card")).toHaveCount(4);
  await expect(controllers[0]!.locator(".scoreboard")).toBeVisible();
  for (const controller of controllers) {
    await expect(controller.locator(".notice--error")).toHaveCount(0);
    await expect(controller.getByText(/this round/)).toBeVisible();
  }
  expect(await host.locator(focusableSelector).count()).toBe(0);

  await participantCards.nth(3).getByRole("button", { name: "Disconnect" }).press("Enter");
  await expect(host.getByText("1 reconnecting", { exact: true })).toBeVisible();
  await participantCards.nth(3).getByRole("button", { name: "Reconnect" }).press("Enter");

  await participantCards.nth(2).getByRole("button", { name: "Make authority" }).press("Enter");
  await expect(controllers[1]!.getByText("Room director")).toBeVisible();
  await expect(controllers[0]!.getByText("Room director")).toHaveCount(0);
});

function controllerFrames(frames: Frame[]): Frame[] {
  return frames.filter((frame) => frame.url().includes("/surfaces/controller.html"));
}
