const { spawn } = require("node:child_process");
const { accessSync, mkdirSync, rmSync, writeFileSync } = require("node:fs");
const { join, resolve } = require("node:path");

function parseArgs(argv) {
  const args = {
    html: null,
    output: null,
    width: 1280,
    height: 1600,
    scale: 2,
    titleSelector: ".slide h2",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--html") args.html = argv[++index];
    else if (value === "--output") args.output = argv[++index];
    else if (value === "--width") args.width = Number(argv[++index]);
    else if (value === "--height") args.height = Number(argv[++index]);
    else if (value === "--scale") args.scale = Number(argv[++index]);
    else if (value === "--title-selector") args.titleSelector = argv[++index];
    else if (value === "--help" || value === "-h") args.help = true;
  }

  return args;
}

function usage() {
  console.log(`
Usage:
  node export-slides.js --html <slides.html> [--output <dir>] [--width 1280] [--height 1600] [--scale 2]

Defaults:
  --html    ./slides.html
  --output  ./png
  --width   1280
  --height  1600
  --scale   2
`);
}

function fileUrl(filePath) {
  return `file:///${resolve(filePath).replaceAll("\\", "/")}`;
}

function safeName(index, text) {
  const slug = String(text || "slide")
    .replace(/[^\p{Script=Han}a-zA-Z0-9]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `${String(index + 1).padStart(2, "0")}-${slug || "slide"}.png`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const htmlPath = resolve(args.html || join(process.cwd(), "slides.html"));
  const outputDir = resolve(args.output || join(process.cwd(), "png"));

  try {
    accessSync(htmlPath);
  } catch {
    throw new Error(`HTML not found: ${htmlPath}`);
  }

  const chromeCandidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);

  const chromePath = chromeCandidates.find((candidate) => {
    try {
      accessSync(candidate);
      return true;
    } catch {
      return false;
    }
  });

  if (!chromePath) {
    throw new Error("Chrome or Edge was not found. Set CHROME_PATH if needed.");
  }

  mkdirSync(outputDir, { recursive: true });
  console.log(`export-slides: html=${htmlPath}`);
  console.log(`export-slides: output=${outputDir}`);

  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const userDataDir = join(outputDir, `.chrome-export-profile-${runId}`);
  const port = 9300 + Math.floor(Math.random() * 400);
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--remote-allow-origins=*",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ], { stdio: "ignore" });
  const keepAlive = setInterval(() => {}, 1000);
  console.log(`export-slides: chrome=${chromePath}`);

  const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

  async function getJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.json();
  }

  async function waitForDebugger() {
    for (let attempt = 0; attempt < 100; attempt += 1) {
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
    socket.addEventListener("message", async (event) => {
      try {
        const raw = event.data;
        let text;
        if (typeof raw === "string") text = raw;
        else if (Buffer.isBuffer(raw)) text = raw.toString("utf8");
        else if (raw instanceof ArrayBuffer) text = Buffer.from(raw).toString("utf8");
        else if (raw && typeof raw.text === "function") text = await raw.text();
        else text = String(raw);

        const message = JSON.parse(text);
        const responseId = Number(message.id);
        if (!Number.isNaN(responseId) && pending.has(responseId)) {
          const { resolveMessage, rejectMessage } = pending.get(responseId);
          pending.delete(responseId);
          if (message.error) rejectMessage(new Error(message.error.message));
          else resolveMessage(message.result);
        }
      } catch (error) {
        console.error(`export-slides: websocket parse failed: ${error.message || error}`);
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

  let cdp;
  try {
    await waitForDebugger();
    console.log("export-slides: debugger ready");
    const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = targets.find((target) => target.type === "page");
    if (!pageTarget?.webSocketDebuggerUrl) {
      throw new Error("Chrome page target was not found.");
    }

    cdp = await openSocket(pageTarget.webSocketDebuggerUrl);
    console.log("export-slides: websocket connected");
    console.log("export-slides: Page.enable");
    await cdp.send("Page.enable");
    console.log("export-slides: Runtime.enable");
    await cdp.send("Runtime.enable");
    console.log("export-slides: set device metrics");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: args.width,
      height: args.height,
      deviceScaleFactor: args.scale,
      mobile: false,
    });

    console.log("export-slides: navigate");
    await cdp.send("Page.navigate", { url: fileUrl(htmlPath) });
    console.log("export-slides: page navigated");

    let slideCount = 0;
    for (let attempt = 0; attempt < 50; attempt += 1) {
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
    console.log(`export-slides: slides=${slideCount}`);

    const { result } = await cdp.send("Runtime.evaluate", {
      returnByValue: true,
      expression: `
        [...document.querySelectorAll(".slide")].map((slide) => {
          const rect = slide.getBoundingClientRect();
          const heading = slide.querySelector(${JSON.stringify(args.titleSelector)})?.textContent?.trim() || "slide";
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
    console.log(`export-slides: exporting=${slides.length}`);
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
  } finally {
    clearInterval(keepAlive);
    if (cdp) cdp.close();
    chrome.kill();
    await sleep(250);
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
