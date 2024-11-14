function getAllCookies() {
  const allCookies = document.cookie.split(";");
  const cookieObjects = [];
  const now = Math.floor(Date.now() / 1000); // Current time in seconds

  allCookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    cookieObjects.push({
      name: decodeURIComponent(name),
      value: decodeURIComponent(value),
      domain: window.location.hostname,
      path: "/",
      expires: now + 86400, // Default to 24 hours from now
      secure: window.location.protocol === "https:",
      httpOnly: false, // We can't detect httpOnly cookies in JS
      sameSite: "Lax", // Default to Lax, adjust if necessary
    });
  });

  return cookieObjects;
}

function getDomainFromHostname(hostname) {
  const parts = hostname.split(".");
  if (parts.length > 2) {
    return "." + parts.slice(-2).join(".");
  }
  return hostname;
}

function exportCookiesToJson() {
  const cookies = getAllCookies();
  const currentHostname = window.location.hostname;
  const currentDomain = getDomainFromHostname(currentHostname);

  // Add domain cookies
  cookies.forEach((cookie) => {
    if (cookie.domain === currentHostname) {
      cookies.push({ ...cookie, domain: currentDomain });
    }
  });

  const jsonString = JSON.stringify(cookies, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, -5);
  const filename = `firefox_cookies_${timestamp}.json`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log(`Cookies exported to ${filename}`);
  return cookies;
}

// Execute the function to export cookies
exportCookiesToJson();
