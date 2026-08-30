const sharp = require("sharp");
const path = require("path");

const W = 1200;
const H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${W}" y2="${H}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#121817"/>
      <stop offset="1" stop-color="#1C2624"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <g stroke="#2A332F" stroke-width="1">
    ${Array.from({ length: 11 }, (_, i) => 80 + i * 104)
      .map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`)
      .join("")}
  </g>

  <rect x="80" y="72" width="56" height="56" rx="14" fill="#3FBF9F"/>
  <text x="108" y="111" text-anchor="middle" font-family="JetBrains Mono" font-size="26" font-weight="700" fill="#0A1614">M</text>

  <text x="78" y="290" font-family="Bricolage Grotesque" font-size="76" font-weight="700" fill="#F3F1EA" letter-spacing="-1">Miraj Patel</text>
  <text x="80" y="350" font-family="Inter" font-size="34" font-weight="500" fill="#9AA6A2">Senior Software Engineer &amp; Technical Lead</text>

  <text x="80" y="430" font-family="Inter" font-size="24" font-weight="400" fill="#6B7A75">Frontend infrastructure  &#183; Microservices and APIs  &#183; Design systems</text>

  <rect x="78" y="490" width="90" height="4" rx="2" fill="#3FBF9F"/>
  <rect x="176" y="490" width="30" height="4" rx="2" fill="#E0785C"/>
</svg>
`;

sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(__dirname, "..", "public", "og-image.png"))
  .then(() => console.log("og-image.png written"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
