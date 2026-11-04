import { createServer } from "vite";
import tailwind from "@tailwindcss/postcss";
import { chromium, expect } from "@playwright/test";
import path from "node:path";
const root = process.cwd();
const server = await createServer({
  configFile: false,
  publicDir: path.join(root, "public"),
  css: { postcss: { plugins: [tailwind()] } },
  root: path.join(root, "tests/ui"),
  resolve: {
    alias: {
      "@": root,
      "next/image": path.join(root, "tests/ui/image.tsx"),
      "next/link": path.join(root, "tests/ui/navigation.tsx"),
      "next/navigation": path.join(root, "tests/ui/navigation.tsx"),
    },
  },
  server: { host: "127.0.0.1", port: 4174, fs: { allow: [root] } },
});
await server.listen();
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1360, height: 1050 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let session;
  let resume;
  const report = {
    summary: "Your experience is clear. Add specific outcomes.",
    strengths: ["Clear project responsibilities"],
    suggestions: [
      {
        section: "Project experience",
        issue: "Results need specific evidence",
        suggestion: "Add real, verifiable project results.",
      },
    ],
    keywords: ["React"],
    revisedResume:
      "Frontend Developer\nExperienced with React and TypeScript, building business pages and components. Project outcomes [To complete].",
  };
  await page.route("**/api/helper*", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        json: route.request().url().includes("id=")
          ? session
          : route.request().url().includes("kind=resumes")
            ? [resume]
            : [session],
      });
    const body = route.request().postDataJSON();
    const now = new Date().toISOString();
    if (body.action === "resume") {
      resume = {
        id: "resume-1",
        role: body.role,
        job: body.job,
        createdAt: now,
        report,
      };
      return route.fulfill({ json: resume });
    }
    if (body.action === "start")
      session = {
        ...body,
        id: "session-1",
        userId: "test-user",
        status: "active",
        createdAt: now,
        updatedAt: now,
        revision: 0,
        messages: [
          {
            role: "assistant",
            content: "Describe a frontend project you worked on.",
            at: now,
          },
        ],
      };
    if (body.action === "answer") {
      session.messages.push({ role: "user", content: body.answer, at: now });
      session.revision++;
      if (session.revision < 3)
        session.messages.push({
          role: "assistant",
          content: `Question ${session.revision + 1}: How did you solve a technical challenge in the project?`,
          at: now,
        });
    }
    if (body.action === "finish") {
      session.status = "completed";
      session.feedback = {
        totalScore: 80,
        summary:
          "Your answers are well structured. Add results and explain how you verified them.",
        categories: [
          "Technical Skills",
          "Communication",
          "Problem Solving",
          "Role Fit",
        ].map((name) => ({
          name,
          score: 80,
          evidence: "You described the component development process.",
          advice: "Add real outcomes.",
        })),
        strengths: ["Well-structured communication"],
        improvements: ["Add evidence of outcomes"],
      };
    }
    return route.fulfill({ json: session });
  });
  await page.goto("http://127.0.0.1:4174/resume");
  await page.getByLabel("Target role").fill("Frontend Developer");
  await page
    .getByLabel("Resume content (paste or edit)")
    .fill(
      "Developed frontend features using React and TypeScript, collaborating with designers and backend engineers to deliver business components.".repeat(
        3,
      ),
    );
  await page
    .getByRole("button", { name: "Analyze and improve resume" })
    .click();
  await expect(page.getByLabel("Revised resume")).toContainText(
    "Frontend Developer",
  );
  await expect(page.locator("body")).not.toContainText(/\p{Script=Han}/u);
  await page.screenshot({
    path: "docs/resume-test-fixture.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Practice with this resume" }).click();
  await expect(page.getByLabel("Target role")).toHaveValue(
    "Frontend Developer",
  );
  await expect(page.getByLabel("Resume content (optional)")).toHaveValue(
    report.revisedResume,
  );
  await page.getByRole("button", { name: "Enter interview" }).click();
  for (let i = 0; i < 3; i++) {
    await page
      .getByLabel("Your answer")
      .fill(
        `I designed, implemented, and tested component ${i + 1}, then reviewed the results with the team.`,
      );
    await page.getByRole("button", { name: "Submit answer" }).click();
    if (i < 2) await expect(page.getByLabel("Your answer")).toHaveValue("");
  }
  await page.getByRole("button", { name: "Generate feedback" }).click();
  await expect(page.getByText("Your interview feedback")).toBeVisible();
  await expect(page.locator(".message")).toHaveCount(6);
  await expect(page.locator("body")).not.toContainText(/\p{Script=Han}/u);
  await page.screenshot({
    path: "docs/interview-test-fixture.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.getByText("Your interview feedback")).toBeVisible();
  const dl = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export transcript and feedback" })
    .click();
  await dl;
  await page.getByRole("link", { name: "My interview history" }).click();
  await expect(page.getByText("80 / 100")).toBeVisible();
  await page
    .getByRole("button", { name: "Resume reviews", exact: true })
    .click();
  await page.getByRole("button", { name: /Frontend Developer/ }).click();
  await expect(page.getByLabel("Revised resume")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await expect(page.locator("body")).not.toContainText(/\p{Script=Han}/u);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "PASS (mock API): resume review → transfer to interview → 3 answers → scoring → reload → export → interview/resume history; mobile overflow check.",
  );
} finally {
  await browser.close();
  await server.close();
}
