const { spawn } = require("node:child_process");
const { mkdirSync, writeFileSync, rmSync } = require("node:fs");
const { join, resolve } = require("node:path");

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

const chromePath = chromeCandidates.find((candidate) => {
  try {
    require("node:fs").accessSync(candidate);
    return true;
  } catch {
    return false;
  }
});

if (!chromePath) {
  throw new Error("Chrome or Edge was not found.");
}

const root = __dirname;
const outputDir = join(root, "png");
const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const userDataDir = join(root, `.chrome-export-profile-${runId}`);
mkdirSync(outputDir, { recursive: true });

const port = 9300 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function waitForDebugger() {
  for (let i = 0; i < 80; i += 1) {
    try {
      return await getJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await sleep(100);
    }
  }
  throw new Error("Chrome debugger did not start.");
}

async function openSocket(url) {
  const socket = new WebSocket(url);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });

  let id = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolveMessage, rejectMessage } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectMessage(new Error(message.error.message));
      else resolveMessage(message.result);
    }
  });

  return {
    send(method, params = {}) {
      id += 1;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveMessage, rejectMessage) => {
        pending.set(id, { resolveMessage, rejectMessage });
      });
    },
    close() {
      socket.close();
    },
  };
}

function fileUrl(path) {
  return `file:///${resolve(path).replaceAll("\\", "/")}`;
}

function safeName(index, text) {
  const slug = text
    .replace(/[^\p{Script=Han}a-zA-Z0-9]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
  return `${String(index + 1).padStart(2, "0")}-${slug || "slide"}.png`;
}

async function main() {
  await waitForDebugger();
  const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find((target) => target.type === "page");
  if (!pageTarget?.webSocketDebuggerUrl) {
    throw new Error("Chrome page target was not found.");
  }
  const cdp = await openSocket(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 1600,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await cdp.send("Page.navigate", { url: fileUrl(join(root, "slides.html")) });
  let slideCount = 0;
  for (let i = 0; i < 40; i += 1) {
    const countResult = await cdp.send("Runtime.evaluate", {
      returnByValue: true,
      expression: `document.querySelectorAll(".slide").length`,
    });
    slideCount = countResult.result.value;
    if (slideCount > 0) break;
    await sleep(100);
  }

  if (slideCount === 0) {
    const debugResult = await cdp.send("Runtime.evaluate", {
      returnByValue: true,
      expression: `({ url: location.href, readyState: document.readyState, bodyLength: document.body?.innerHTML?.length || 0 })`,
    });
    throw new Error(`No slides found: ${JSON.stringify(debugResult.result.value)}`);
  }
  console.log(`slides found: ${slideCount}`);

  const { result } = await cdp.send("Runtime.evaluate", {
    returnByValue: true,
    expression: `
      [...document.querySelectorAll(".slide")].map((slide) => {
        const rect = slide.getBoundingClientRect();
        const heading = slide.querySelector("h2")?.textContent?.trim() || "slide";
        return {
          heading,
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        };
      })
    `,
  });

  const slides = result.value;
  console.log(`slides to export: ${slides.length}`);
  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: slide.x,
        y: slide.y,
        width: slide.width,
        height: slide.height,
        scale: 1,
      },
    });
    const filename = safeName(index, slide.heading);
    writeFileSync(join(outputDir, filename), Buffer.from(screenshot.data, "base64"));
    console.log(filename);
  }

  cdp.close();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    chrome.kill();
    await sleep(250);
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  });
