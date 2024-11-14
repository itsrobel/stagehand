function getMidwayAuthCookies() {
  const allCookies = document.cookie.split(";");
  const midwayAuthCookies = [];

  allCookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    midwayAuthCookies.push({
      name: decodeURIComponent(name),
      value: decodeURIComponent(value),
      domain: ".midway-auth.amazon.com",
      path: "/",
    });
  });
  const jsonString = JSON.stringify(midwayAuthCookies, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "sub_domain.json";
  a.click();
  URL.revokeObjectURL(url);

  return midwayAuthCookies;
}

console.log(getMidwayAuthCookies());
