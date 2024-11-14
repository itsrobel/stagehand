const http = require("http");
const httpProxy = require("http-proxy");
const fs = require("fs");

// Create a proxy server
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
});

// Create a server that uses the proxy
const server = http.createServer((req, res) => {
  // Log the request
  logTraffic(req, "REQUEST");

  // Proxy the request to Amazon.com
  proxy.web(req, res, { target: "https://www.amazon.com" });
});

// Listen for the 'proxyRes' event to log the response
proxy.on("proxyRes", (proxyRes, req, res) => {
  logTraffic(proxyRes, "RESPONSE");
});

// Function to log traffic
function logTraffic(obj, type) {
  const log = {
    timestamp: new Date().toISOString(),
    type: type,
    url: type === "REQUEST" ? obj.url : "",
    method: type === "REQUEST" ? obj.method : "",
    headers: obj.headers,
    cookies: obj.headers.cookie || "",
  };

  // Append the log to a file
  fs.appendFile("traffic.log", JSON.stringify(log) + "\n", (err) => {
    if (err) console.error("Error writing to log file:", err);
  });
}

// Start the server
const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
