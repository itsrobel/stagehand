const https = require("https");
const fs = require("fs");
const express = require("express");
const httpProxy = require("http-proxy");

const app = express();
const proxy = httpProxy.createProxyServer();

const PORT = 3000;
// Load SSL certificate and key
// const sslOptions = {
//   key: fs.readFileSync("privatekey.pem"), // Path to your private key
//   cert: fs.readFileSync("certificate.pem"), // Path to your self-signed certificate
// };

// Target website (replace with the actual target URL)
// const TARGET_URL = "https://midway-auth.amazon.com";
const TARGET_URL = "https://midway-auth.amazon.com/login?next=%2F";
// Middleware to log GET requests and modify headers
app.use((req, res, next) => {
  if (req.method === "GET") {
    console.log(`Captured GET request: ${req.url}`);

    // Forward client cookies if present
    if (req.headers.cookie) {
      console.log("Forwarding Cookies:", req.headers.cookie);
    }

    // Modify headers if necessary
    // req.headers["origin"] = "https://your-custom-origin.com"; // Modify origin if needed

    console.log("Modified Headers:", req.headers);
  }
  next();
});

// Proxy all requests to the target URL
app.all("*", (req, res) => {
  proxy.web(req, res, {
    target: TARGET_URL,
    changeOrigin: true,
    secure: false, // Disable SSL verification if necessary\
    // secure: true, // Ensure we're making secure requests to the target server
    headers: {
      cookie: req.headers.cookie || "", // Forward cookies from the client
    },
  });
});

// Handle proxy errors
proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  res.status(500).send("Proxy error");
});

// Start HTTPS server on port 3000
// https.createServer(sslOptions, app).listen(3000, () => {
//   console.log("HTTPS Proxy server running on https://localhost:3000");
// });
//
//

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
