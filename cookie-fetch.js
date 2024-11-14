function getCookiesForSite(site) {
  const allCookies = document.cookie.split(";");
  const playwrightCookies = [];
  const siteRegex = new RegExp(`^.*${site.replace(/\./g, "\\.")}$`);

  allCookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    const decodedName = decodeURIComponent(name);
    const decodedValue = decodeURIComponent(value);

    if (siteRegex.test(document.domain)) {
      playwrightCookies.push({
        name: decodedName,
        value: decodedValue,
        domain: document.domain,
        path: "/",
      });
    }
  });

  // Save cookies to a JSON file
  const jsonString = JSON.stringify(playwrightCookies, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "playwright_cookies.json";
  a.click();
  URL.revokeObjectURL(url);

  return playwrightCookies;
}

// Usage
const site = "midway-auth.amazon.com";
getCookiesForSite(site);
