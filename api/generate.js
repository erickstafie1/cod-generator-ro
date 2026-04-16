// api/generate.js
// Vercel Serverless Function - ruleaza server-side, fara CORS, fara limitari browser

const https = require("https");
const http = require("http");

// Fetch simplu server-side (nu are restrictii CORS ca browserul)
function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        ...headers
      },
      timeout: 15000
    }, (res) => {
      // Urmareste redirect-uri
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location, headers).then(resolve).catch(reject);
      }

      const chunks = [];
      const encoding = res.headers["content-encoding"];

      if (encoding === "gzip" || encoding === "br" || encoding === "deflate") {
        const zlib = require("zlib");
        let decompress;
        if (encoding === "gzip") decompress = zlib.createGunzip();
        else if (encoding === "br") decompress = zlib.createBrotliDecompress();
        else decompress = zlib.createInflate();
        res.pipe(decompress);
        decompress.on("data", c => chunks.push(c));
        decompress.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        decompress.on("error", reject);
      } else {
        res.on("data", c => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      }
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// Extrage imaginile din HTML-ul AliExpress
function extractAliExpressImages(html) {
  const images = new Set();

  // Metoda 1: JSON-ul de date din pagina (window.runParams sau __NEXT_DATA__)
  const dataPatterns = [
    /imagePathList["'\s]*:["'\s]*(\[.*?\])/gs,
    /"imageUrl["'\s]*:["'\s]*"(https:\/\/ae\d*\.alicdn\.com[^"]+)"/g,
    /"image["'\s]*:["'\s]*"(https:\/\/ae\d*\.alicdn\.com[^"]+)"/g,
    /https:\/\/ae\d*\.alicdn\.com\/kf\/[A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp)/gi,
    /https:\/\/ae01\.alicdn\.com\/kf\/[^"'\s)]+/gi,
    /https:\/\/ae02\.alicdn\.com\/kf\/[^"'\s)]+/gi,
    /https:\/\/ae03\.alicdn\.com\/kf\/[^"'\s)]+/gi,
  ];

  for (const pattern of dataPatterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(html)) !== null) {
      const url = match[1] || match[0];
      if (url && url.startsWith("http")) {
        // Curata URL-ul si seteaza rezolutia mare
        const clean = url
          .replace(/\\u002F/g, "/")
          .replace(/\\/g, "")
          .replace(/_\d+x\d+\.jpg/, "_800x800.jpg")
          .replace(/\.jpg_\d+x\d+/, ".jpg")
          .split(".jpg")[0] + ".jpg";
        if (clean.includes("alicdn.com") && clean.length > 40) {
          images.add(clean);
        }
      }
    }
  }

  // Metoda 2: Tag-uri <img> cu alicdn
  const imgTagPattern = /src=["'](https:\/\/[^"']*alicdn\.com[^"']*\.(jpg|jpeg|png|webp))[^"']*/gi;
  let m;
  while ((m = imgTagPattern.exec(html)) !== null) {
    images.add(m[1]);
  }

  return [...images].slice(0, 8);
}

// Extrage titlul si descrierea din AliExpress HTML
function extractAliExpressText(html) {
  let title = "";
  let price = 0;

  // Titlu
  const titlePatterns = [
    /<title[^>]*>([^<]+)<\/title>/i,
    /"subject":"([^"]+)"/,
    /"title":"([^"]+)"/,
    /class="[^"]*product-title[^"]*"[^>]*>([^<]+)</i,
  ];
  for (const p of titlePatterns) {
    const m = html.match(p);
    if (m && m[1] && m[1].length > 5) {
      title = m[1].replace(/ - AliExpress.*$/i, "").replace(/&amp;/g, "&").trim();
      break;
    }
  }

  // Pret
  const pricePatterns = [
    /"price":"([0-9.]+)"/,
    /"salePrice":{"value":"([0-9.]+)"/,
    /US \$([0-9.]+)/,
  ];
  for (const p of pricePatterns) {
    const m = html.match(p);
    if (m) { price = parseFloat(m[1]); break; }
  }

  return { title, price };
}

// Apeleaza Claude API pentru copywriting
async function generateCopywriting(productInfo) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY nu e setat in Vercel Environment Variables");

  const body = JSON.stringify({
    model: "claude-opus-4-5",
    max_tokens: 2000,
    system: "Ești expert în marketing direct COD (cash on delivery) din România. Răspunzi DOAR cu JSON valid, fără backtick-uri, fără text în afara JSON-ului.",
    messages: [{
      role: "user",
      content: `Creează conținut complet pentru o pagină de vânzare COD în România pentru acest produs:

Titlu produs: ${productInfo.title}
Preț achiziție: ~${productInfo.priceUSD} USD

Returnează DOAR acest JSON:
{
  "productName": "numele comercial scurt în română",
  "headline": "titlu captivant max 12 cuvinte cu beneficiul principal",
  "subheadline": "2 propoziții convingătoare despre produs",
  "price": 149,
  "oldPrice": 249,
  "bumpPrice": 29,
  "stock": 7,
  "timerMinutes": 14,
  "reviewCount": 1247,
  "benefits": [
    "beneficiu detaliat 1",
    "beneficiu detaliat 2", 
    "beneficiu detaliat 3",
    "beneficiu detaliat 4",
    "beneficiu detaliat 5",
    "beneficiu detaliat 6"
  ],
  "howItWorks": [
    {"title": "Pasul 1", "desc": "descriere"},
    {"title": "Pasul 2", "desc": "descriere"},
    {"title": "Pasul 3", "desc": "descriere"}
  ],
  "bumpProduct": "produs complementar scurt",
  "testimonials": [
    {"text": "testimonial credibil detaliat", "name": "Prenume Nume", "city": "Oraș", "stars": 5},
    {"text": "testimonial 2 cu rezultat specific", "name": "Prenume Nume", "city": "Oraș", "stars": 5},
    {"text": "testimonial 3", "name": "Prenume Nume", "city": "Oraș", "stars": 5},
    {"text": "testimonial 4", "name": "Prenume Nume", "city": "Oraș", "stars": 5}
  ],
  "faq": [
    {"q": "Întrebare specifică produsului?", "a": "Răspuns detaliat."},
    {"q": "Cum se face plata?", "a": "Plata se face la livrare, direct curierului. Nu plătești nimic în avans."},
    {"q": "Cât durează livrarea?", "a": "2–4 zile lucrătoare în toată România."},
    {"q": "Pot returna produsul?", "a": "Da, 30 de zile retur gratuit."}
  ]
}`
    }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body)
      }
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try {
          const data = JSON.parse(Buffer.concat(chunks).toString());
          const text = (data.content || []).map(c => c.text || "").join("");
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("No JSON in Claude response");
          resolve(JSON.parse(match[0]));
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── MAIN HANDLER ──
module.exports = async function handler(req, res) {
  // CORS - permite orice origine
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { aliUrl, productName } = req.body;

    let images = [];
    let productInfo = { title: productName || "", priceUSD: 0 };

    // ── SCRAPE ALIEXPRESS daca avem link
    if (aliUrl && aliUrl.includes("aliexpress.com")) {
      console.log("Scraping AliExpress:", aliUrl);
      try {
        const html = await fetchUrl(aliUrl);
        images = extractAliExpressImages(html);
        const extracted = extractAliExpressText(html);
        if (extracted.title) productInfo.title = extracted.title;
        if (extracted.price) productInfo.priceUSD = extracted.price;
        console.log(`Extracted ${images.length} images, title: ${productInfo.title}`);
      } catch (scrapeErr) {
        console.error("Scrape error:", scrapeErr.message);
        // Continua fara poze daca scraping esueaza
      }
    }

    // ── GENEREAZA COPYWRITING cu Claude
    const copy = await generateCopywriting(productInfo);

    // ── COMBINA: poze reale + copy generat
    copy.images = images.length > 0 ? images : [];
    copy.aliUrl = aliUrl || null;

    res.status(200).json({ success: true, data: copy });

  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
