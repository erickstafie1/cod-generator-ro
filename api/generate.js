const https = require("https");
const http = require("http");

// Fetch cu headers de browser real
function fetchUrl(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    const options = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
        ...extraHeaders
      },
      timeout: 20000
    };

    const req = lib.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirect = res.headers.location.startsWith("http")
          ? res.headers.location
          : `https://www.aliexpress.com${res.headers.location}`;
        return fetchUrl(redirect, extraHeaders).then(resolve).catch(reject);
      }

      const chunks = [];
      const enc = res.headers["content-encoding"];

      const processChunks = () => resolve(Buffer.concat(chunks).toString("utf8"));

      if (enc === "gzip") {
        const zlib = require("zlib");
        const gunzip = zlib.createGunzip();
        res.pipe(gunzip);
        gunzip.on("data", c => chunks.push(c));
        gunzip.on("end", processChunks);
        gunzip.on("error", reject);
      } else if (enc === "br") {
        const zlib = require("zlib");
        const brotli = zlib.createBrotliDecompress();
        res.pipe(brotli);
        brotli.on("data", c => chunks.push(c));
        brotli.on("end", processChunks);
        brotli.on("error", reject);
      } else {
        res.on("data", c => chunks.push(c));
        res.on("end", processChunks);
      }
    });

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// Extrage imagini din HTML AliExpress
function extractImages(html) {
  const images = new Set();

  // Metoda 1: JSON embedded in pagina - cel mai fiabil
  try {
    const jsonMatch = html.match(/window\.runParams\s*=\s*(\{.+?\});\s*\n/s) ||
                      html.match(/"imagePathList"\s*:\s*(\[.*?\])/s) ||
                      html.match(/skuImageList['"]\s*:\s*(\[.*?\])/s);
    if (jsonMatch) {
      const urls = jsonMatch[1].match(/https:\/\/ae\d*\.alicdn\.com\/kf\/[^"'\\]+\.(jpg|jpeg|png|webp)/gi);
      if (urls) urls.forEach(u => images.add(u.split("_")[0] + ".jpg"));
    }
  } catch(e) {}

  // Metoda 2: Toate URL-urile alicdn din HTML
  const patterns = [
    /https:\/\/ae\d+\.alicdn\.com\/kf\/[A-Za-z0-9_\-]+\.(jpg|jpeg|png|webp)/gi,
    /https:\/\/ae01\.alicdn\.com\/kf\/[^"'\s<>]+/gi,
    /https:\/\/ae02\.alicdn\.com\/kf\/[^"'\s<>]+/gi,
    /https:\/\/ae03\.alicdn\.com\/kf\/[^"'\s<>]+/gi,
    /https:\/\/img\.alicdn\.com\/imgextra\/[^"'\s<>]+/gi,
  ];

  for (const pattern of patterns) {
    const matches = html.match(pattern) || [];
    matches.forEach(url => {
      // Curata URL si seteaza rezolutie mare
      const clean = url
        .replace(/\\u002F/g, "/")
        .replace(/\\/g, "")
        .split(/['"<>\s]/)[0]
        .replace(/_\d+x\d+[qQ]?\d*\.(jpg|jpeg|png|webp)$/i, ".jpg")
        .replace(/\.(jpg|jpeg|png|webp)_.+$/i, ".jpg");
      if (clean.startsWith("https://") && clean.length > 50) {
        images.add(clean);
      }
    });
  }

  // Metoda 3: Cauta in tag-uri img
  const imgSrcPattern = /src=["'](https:\/\/[^"']*alicdn\.com[^"']*)/gi;
  let m;
  while ((m = imgSrcPattern.exec(html)) !== null) {
    images.add(m[1].split("?")[0]);
  }

  // Filtreaza: pastreaza doar poze mari (nu icoane)
  return [...images]
    .filter(url => {
      const lower = url.toLowerCase();
      return !lower.includes("icon") &&
             !lower.includes("logo") &&
             !lower.includes("avatar") &&
             !lower.includes("50x50") &&
             !lower.includes("30x30") &&
             lower.includes("alicdn.com");
    })
    .slice(0, 8);
}

// Extrage titlu si pret
function extractMeta(html) {
  let title = "";
  let priceUSD = 0;

  const titlePatterns = [
    /<title[^>]*>([^<|]+)/i,
    /"subject"\s*:\s*"([^"]{10,})"/,
    /"title"\s*:\s*"([^"]{10,})"/,
    /class="[^"]*product-title[^"]*"[^>]*>\s*([^<]+)/i,
  ];

  for (const p of titlePatterns) {
    const m = html.match(p);
    if (m?.[1]?.trim().length > 5) {
      title = m[1]
        .replace(/\s*[-|]\s*AliExpress.*$/i, "")
        .replace(/&amp;/g, "&")
        .replace(/&#\d+;/g, "")
        .trim();
      if (title.length > 5) break;
    }
  }

  const pricePatterns = [
    /"discountPrice"\s*:\s*\{"value"\s*:\s*"([0-9.]+)"/,
    /"salePrice"\s*:\s*\{"value"\s*:\s*"([0-9.]+)"/,
    /"price"\s*:\s*"([0-9.]+)"/,
    /US \$\s*([0-9.]+)/,
    /\$\s*([0-9.]+)/,
  ];

  for (const p of pricePatterns) {
    const m = html.match(p);
    if (m?.[1]) { priceUSD = parseFloat(m[1]); if (priceUSD > 0) break; }
  }

  return { title, priceUSD };
}

// Claude API pentru copywriting
function generateCopy(productInfo) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY nu e setat in Vercel Environment Variables");

  const ronPrice = productInfo.priceUSD > 0
    ? Math.round(productInfo.priceUSD * 5 * 2.5 / 10) * 10
    : 149;

  const body = JSON.stringify({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system: "Ești expert în marketing direct COD (cash on delivery) din România. Răspunzi DOAR cu JSON valid, fără backtick-uri, fără text în afara JSON-ului.",
    messages: [{
      role: "user",
      content: `Creează conținut complet pentru o pagină de vânzare COD în România pentru:

Titlu produs: ${productInfo.title || "Produs AliExpress"}
Preț achiziție: ~${productInfo.priceUSD} USD
Preț recomandat vânzare: ~${ronPrice} lei

Returnează DOAR acest JSON:
{
  "productName": "numele comercial scurt în română",
  "headline": "titlu captivant max 12 cuvinte cu beneficiul principal",
  "subheadline": "2 propoziții convingătoare despre produs",
  "price": ${ronPrice},
  "oldPrice": ${Math.round(ronPrice * 1.6)},
  "bumpPrice": ${Math.round(ronPrice * 0.2)},
  "stock": 7,
  "timerMinutes": 14,
  "reviewCount": 1247,
  "benefits": ["beneficiu 1","beneficiu 2","beneficiu 3","beneficiu 4","beneficiu 5","beneficiu 6"],
  "howItWorks": [
    {"title":"Pasul 1","desc":"descriere"},
    {"title":"Pasul 2","desc":"descriere"},
    {"title":"Pasul 3","desc":"descriere"}
  ],
  "bumpProduct": "produs complementar scurt",
  "testimonials": [
    {"text":"testimonial credibil detaliat","name":"Prenume Nume","city":"Oraș","stars":5},
    {"text":"testimonial 2","name":"Prenume Nume","city":"Oraș","stars":5},
    {"text":"testimonial 3","name":"Prenume Nume","city":"Oraș","stars":5},
    {"text":"testimonial 4","name":"Prenume Nume","city":"Oraș","stars":5}
  ],
  "faq": [
    {"q":"Întrebare specifică produsului?","a":"Răspuns detaliat."},
    {"q":"Cum se face plata?","a":"Plata se face la livrare, direct curierului. Nu plătești nimic în avans."},
    {"q":"Cât durează livrarea?","a":"2–4 zile lucrătoare în toată România."},
    {"q":"Pot returna produsul?","a":"Da, 30 de zile retur gratuit."}
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
          if (data.error) throw new Error(data.error.message);
          const text = (data.content || []).map(c => c.text || "").join("");
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) throw new Error("No JSON in response");
          resolve(JSON.parse(match[0]));
        } catch(e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// MAIN HANDLER
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { aliUrl } = req.body;
    if (!aliUrl) return res.status(400).json({ error: "aliUrl lipsește" });

    let images = [];
    let productInfo = { title: "", priceUSD: 0 };

    // Incearca mai multe URL-uri AliExpress (mobile e mai usor de scrapat)
    const urlsToTry = [
      aliUrl,
      aliUrl.replace("www.aliexpress.com", "m.aliexpress.com"),
      aliUrl.replace("www.aliexpress.com/item/", "www.aliexpress.com/i/"),
    ];

    let html = "";
    for (const url of urlsToTry) {
      try {
        console.log("Trying:", url);
        html = await fetchUrl(url);
        if (html.length > 5000) {
          console.log("Got HTML, length:", html.length);
          break;
        }
      } catch(e) {
        console.log("Failed:", url, e.message);
      }
    }

    if (html.length > 1000) {
      images = extractImages(html);
      const meta = extractMeta(html);
      productInfo = meta;
      console.log(`Extracted ${images.length} images, title: "${meta.title}", price: $${meta.priceUSD}`);
    } else {
      console.log("Could not fetch AliExpress page, HTML too short:", html.length);
    }

    // Genereaza copywriting cu Claude
    const copy = await generateCopy(productInfo);
    copy.images = images;

    res.status(200).json({ success: true, data: copy });

  } catch(err) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
