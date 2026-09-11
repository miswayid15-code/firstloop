// vite.config.js
import { defineConfig } from "file:///D:/node_js/dealora/admin/node_modules/vite/dist/node/index.js";
import react from "file:///D:/node_js/dealora/admin/node_modules/@vitejs/plugin-react/dist/index.js";
import path3 from "path";

// api/utils/fetchCardData.js
import axios from "file:///D:/node_js/dealora/admin/node_modules/axios/index.js";
function getRelativeImagePath(value) {
  if (!value) return "";
  let str = String(value).trim();
  if (str.startsWith("data:") || str.startsWith("blob:")) {
    return str;
  }
  const uploadsMatch = str.match(/(uploads\/.*)/i);
  if (uploadsMatch) {
    return uploadsMatch[1].replace(/^\/+/, "");
  }
  while (str.includes("http://") || str.includes("https://")) {
    const lastHttp = str.lastIndexOf("http://");
    const lastHttps = str.lastIndexOf("https://");
    const idx = Math.max(lastHttp, lastHttps);
    try {
      const url = new URL(str.substring(idx));
      str = url.pathname;
    } catch (e) {
      str = str.replace(/^https?:\/\/[^/]+/i, "");
    }
  }
  return str.replace(/^\/+/, "");
}
function formatImageUrl(img, baseUrl) {
  if (!img) return "";
  let str = String(img).trim();
  if (str === "none" || str === "null" || str === "undefined" || str === "false") {
    return "";
  }
  if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:") || str.startsWith("blob:")) {
    return str;
  }
  const rel = getRelativeImagePath(str);
  if (!rel) return "";
  const cleanBase = (baseUrl || "").replace(/\/+$/, "");
  const cleanImg = rel.replace(/^\/+/, "");
  return cleanBase ? `${cleanBase}/${cleanImg}` : cleanImg;
}
async function fetchCardData({ id, type = 1, cus_id = 1, query = {} }) {
  const cardId = Number(id) || 1;
  const cardType = Number(type) === 2 ? 2 : 1;
  const customerId = Number(cus_id) || 1;
  const baseUrl = (process.env.VITE_API_URL || process.env.API_URL || "https://dealora-7st9.onrender.com").replace(/\/+$/, "");
  try {
    const payload = {
      id: cardId,
      type: cardType
    };
    if (customerId) {
      payload.cus_id = customerId;
    }
    const response = await axios.post(`${baseUrl}/firstloop/customer/fetch-card`, payload, {
      timeout: 6e3,
      headers: {
        "Content-Type": "application/json",
        "X-Skip-Auth-Redirect": "true"
      }
    });
    if (response?.data?.status === 1 && response?.data?.data) {
      const raw = response.data.data;
      const item = Array.isArray(raw) ? raw[0] : raw;
      if (item) {
        const totalStamps2 = Number(item.number_of_stamps || item.total_stamps || 8);
        const CustomerStampLevels = Array.isArray(item.CustomerStampLevels) ? item.CustomerStampLevels : Array.isArray(item.stamp_levels) ? item.stamp_levels : [];
        const levelRewards = CustomerStampLevels.length > 0 ? CustomerStampLevels.map((lvl, idx) => {
          const rawType = String(lvl.reward_type ?? lvl.type ?? "").trim().toLowerCase();
          const isDiscount = rawType === "2" || rawType === "discount";
          const isPaid = rawType === "3" || rawType === "paid";
          const rType = isDiscount ? "Discount" : isPaid ? "Paid" : "Free";
          return {
            id: Number(lvl.id || lvl.stamp_level_id || 0),
            stamp_number: Number(lvl.stamp_number || lvl.stamp) || idx + 1,
            status: Number(lvl.status) || 0,
            reward: lvl.reward_text || (isDiscount ? "Discount" : isPaid ? "Paid" : "Free Item"),
            type: rType,
            discountVal: isDiscount ? parseFloat(lvl.discount ?? lvl.discountVal ?? 10) : 0,
            icon: lvl.icon || (isDiscount ? "fa-percent" : isPaid ? "fa-tag" : "fa-gift"),
            amt: Number(lvl.amt) || 0
          };
        }) : Array.from({ length: totalStamps2 }).map((_, i) => ({
          id: 0,
          stamp_number: i + 1,
          status: i < Number(item.current_stamp ?? item.collected ?? 0) ? 1 : 0,
          reward: `Stamp #${i + 1}`,
          type: "Free",
          discountVal: 0,
          icon: "fa-gift",
          amt: 0
        }));
        const brandLogoRaw = item.brand_image || item.brand_logo;
        const bgImageRaw = item.background_image || item.bg_image || item.bgImage;
        return {
          id: cardId,
          card_type: cardType,
          title: item.title || (cardType === 2 ? "VIP Membership Pass" : "Loyalty Stamp Card"),
          brandName: item.brand_name || "FirstPass",
          brandLogo: formatImageUrl(brandLogoRaw, baseUrl),
          total_stamps: totalStamps2,
          cardholderName: item.customer_name || item.customer?.name || "Customer",
          bgColor: item.background_color || (cardType === 2 ? "#D97706" : "#0E88B8"),
          bgImage: formatImageUrl(bgImageRaw, baseUrl),
          textColor: item.text_color || "#FFFFFF",
          borderColor: item.border_color || (cardType === 2 ? "#FFFFFF" : "#00A6D6"),
          stampBgColor: item.stamp_background || "rgba(255, 255, 255, 0.3)",
          stampBorderColor: item.stamp_border_color || "#FFFFFF",
          stampTextColor: item.stamp_text_color || "#FFFFFF",
          stamp_radius: Number(item.stamp_radius ?? 50),
          qr_token: item.qr_token || `dealora-card-${cardId}-${customerId}`,
          CustomerStampLevels,
          levelRewards,
          validity: item.validity || "12 Months",
          description: item.description || ""
        };
      }
    }
  } catch (err) {
    console.warn("fetchCardData API failed or timed out, using fallback parameters:", err.message);
  }
  const totalStamps = Number(query.stamps || query.total_stamps || 8);
  const discountVal = query.discount || query.discountVal || "10";
  const queryBgImage = query.bgImage || query.bg_image || query.background_image || "";
  const queryLogo = query.logo || query.brand_logo || query.brand_image || "";
  return {
    id: cardId,
    card_type: cardType,
    title: query.title || (cardType === 2 ? "Membership Pass" : "Digital Stamp Card"),
    brandName: query.brand || query.brand_name || "FirstPass",
    brandLogo: formatImageUrl(queryLogo, baseUrl),
    total_stamps: totalStamps,
    cardholderName: query.name || query.customer_name || "Customer",
    bgColor: query.bgColor || query.bg_color || (cardType === 2 ? "#D97706" : "#0E88B8"),
    bgImage: formatImageUrl(queryBgImage, baseUrl),
    textColor: query.textColor || "#FFFFFF",
    borderColor: query.borderColor || query.border_color || "#FFFFFF",
    stampBgColor: query.stampBgColor || "rgba(255, 255, 255, 0.3)",
    stampBorderColor: query.stampBorderColor || "#FFFFFF",
    stampTextColor: query.stampTextColor || "#FFFFFF",
    stamp_radius: 50,
    qr_token: query.qr || `dealora-card-${cardId}-${customerId}`,
    levelRewards: Array.from({ length: totalStamps }).map((_, i) => ({
      stamp_number: i + 1,
      reward: i + 1 === totalStamps ? `${discountVal}% OFF Reward` : "Free Reward",
      type: i + 1 === totalStamps ? "Discount" : "Free",
      discountVal: i + 1 === totalStamps ? Number(discountVal) : 0,
      icon: "fa-gift",
      status: 0
    })),
    validity: query.validity || "12 Months",
    description: query.description || ""
  };
}

// api/utils/cardSvgGenerator.js
import fs from "fs";
import path from "path";
import sharp from "file:///D:/node_js/dealora/admin/node_modules/sharp/dist/index.mjs";
import QRCode from "file:///D:/node_js/dealora/admin/node_modules/qrcode/lib/index.js";
import axios2 from "file:///D:/node_js/dealora/admin/node_modules/axios/index.js";
var SVG_ICONS = {
  user: "M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z",
  gift: "M112 0a64 64 0 0 0 -64 64v32H16C7.2 96 0 103.2 0 112v48c0 8.8 7.2 16 16 16h16v272c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V176h16c8.8 0 16-7.2 16-16V112c0-8.8-7.2-16-16-16h-32V64a64 64 0 0 0 -64-64H112zM288 96V64a32 32 0 0 1 32-32h64a32 32 0 0 1 32 32v32H288zM224 96H96V64a32 32 0 0 1 32-32h64a32 32 0 0 1 32 32v32zM80 176h144v288H96c-17.7 0-32-14.3-32-32V176h16zm208 288V176h144v256c0 17.7-14.3 32-32 32H288z",
  tag: "M0 80V229.5c0 17 6.7 33.3 18.7 45.3l192 192c25 25 65.5 25 90.5 0L467.5 300.5c25-25 25-65.5 0-90.5l-192-192C263.5 6.7 247.2 0 230.2 0H80C35.8 0 0 35.8 0 80zm112 48a48 48 0 1 1 0-96 48 48 0 1 1 0 96z"
};
function escapeXml(unsafe) {
  if (!unsafe) return "";
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
async function getBase64Image(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("data:image/")) return imageUrl;
  try {
    const response = await axios2.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 5e3
    });
    const pngBuf = await sharp(Buffer.from(response.data)).png().toBuffer();
    return `data:image/png;base64,${pngBuf.toString("base64")}`;
  } catch (e) {
    console.warn("Could not fetch or convert background/brand image:", imageUrl, e.message);
    return null;
  }
}
var cachedFlLogoBase64 = null;
function getLocalFirstLoopLogo() {
  if (cachedFlLogoBase64) return cachedFlLogoBase64;
  try {
    const logoPath = path.resolve(process.cwd(), "src", "assets", "img", "firstloop-favicon.png");
    if (fs.existsSync(logoPath)) {
      const buf = fs.readFileSync(logoPath);
      cachedFlLogoBase64 = `data:image/png;base64,${buf.toString("base64")}`;
      return cachedFlLogoBase64;
    }
  } catch (e) {
  }
  return null;
}
async function generateCardPngBuffer(card) {
  const width = 840;
  const height = 480;
  const type = Number(card.card_type || 1) === 2 ? 2 : 1;
  const defaultBg = type === 2 ? "#D97706" : "#0E88B8";
  const bgColor = card.bgColor || defaultBg;
  const borderColor = card.borderColor || (type === 2 ? "#FFFFFF" : "#00A6D6");
  const textColor = card.textColor || "#FFFFFF";
  const totalStamps = Number(card.total_stamps || card.number_of_stamps || 8);
  const stampRadiusPercent = Number(card.stamp_radius ?? 50);
  const stampBorderRadius = stampRadiusPercent / 100 * 36;
  const stampBgColor = card.stampBgColor || "rgba(255, 255, 255, 0.3)";
  const stampBorderColor = card.stampBorderColor || "#FFFFFF";
  const stampTextColor = card.stampTextColor || textColor;
  const brandName = escapeXml(card.brandName || "Merchant");
  const cardTitle = escapeXml(card.title || (type === 2 ? "Membership Pass" : "Stamp Pass"));
  const customerName = escapeXml(card.cardholderName || card.customer_name || (type === 2 ? "Member Pass" : "Stamp Pass"));
  const validity = escapeXml(card.validity || "12 Months");
  const scanText = type === 2 ? "SCAN PASS" : "SCAN TO STAMP";
  const qrData = card.qr_token || card.qrImg || `dealora-${card.id || 1}`;
  let qrSvg = "";
  try {
    qrSvg = await QRCode.toString(qrData, {
      type: "svg",
      margin: 0,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    });
    qrSvg = qrSvg.replace(/<\?xml.*?\?>/, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "");
  } catch (err) {
    console.warn("QR Code generation error:", err.message);
  }
  let brandLogoBase64 = null;
  if (card.brandLogo) {
    brandLogoBase64 = await getBase64Image(card.brandLogo);
  }
  let bgImageBase64 = null;
  if (card.bgImage && card.bgImage !== "none" && card.bgImage !== "null" && card.bgImage !== "undefined") {
    bgImageBase64 = await getBase64Image(card.bgImage);
  }
  const flLogoBase64 = getLocalFirstLoopLogo();
  let stampGridSvg = "";
  if (type === 1) {
    const levels = card.levelRewards || card.CustomerStampLevels || card.stamp_levels || [];
    const stampW = 72;
    const stampH = 72;
    const gapX = 12;
    const gapY = 12;
    const maxCols = 5;
    const startX = 44;
    const startY = 196;
    for (let i = 0; i < totalStamps; i++) {
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);
      const x = startX + col * (stampW + gapX);
      const y = startY + row * (stampH + gapY);
      const stampNum = i + 1;
      const rewardItem = levels.find((l) => Number(l.stamp_number) === stampNum) || levels[i];
      const rawType = String(rewardItem?.reward_type ?? rewardItem?.type ?? "").trim().toLowerCase();
      const isDiscount = rawType === "2" || rawType === "discount";
      const isPaid = rawType === "3" || rawType === "paid";
      const isFree = rawType === "1" || rawType === "free";
      let insideContent = "";
      if (rewardItem && isDiscount) {
        const disc = Number(rewardItem.discount ?? rewardItem.discountVal ?? (parseInt(rewardItem.reward_text) || 10));
        insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2 + 7}" 
                          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="20" font-weight="900" fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">
                        ${disc}%
                    </text>
                `;
      } else if (rewardItem && isPaid) {
        insideContent = `
                    <g transform="translate(${x + (stampW - 28) / 2}, ${y + (stampH - 28) / 2}) scale(0.054)">
                        <path d="${SVG_ICONS.tag}" fill="${stampTextColor}" />
                    </g>
                `;
      } else if (rewardItem && isFree) {
        insideContent = `
                    <g transform="translate(${x + (stampW - 28) / 2}, ${y + (stampH - 28) / 2}) scale(0.054)">
                        <path d="${SVG_ICONS.gift}" fill="${stampTextColor}" />
                    </g>
                `;
      } else {
        insideContent = `
                    <text x="${x + stampW / 2}" y="${y + stampH / 2 + 7}" 
                          font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="26" font-weight="800" fill="${stampTextColor}" text-anchor="middle" dominant-baseline="central">
                        ${stampNum}
                    </text>
                `;
      }
      stampGridSvg += `
                <g>
                    <rect x="${x}" y="${y}" width="${stampW}" height="${stampH}" rx="${stampBorderRadius}" ry="${stampBorderRadius}"
                          fill="${stampBgColor}" stroke="${stampBorderColor}" stroke-width="4" />
                    ${insideContent}
                </g>
            `;
    }
  }
  const svgString = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <clipPath id="cardClip">
                <rect x="0" y="0" width="${width}" height="${height}" rx="44" ry="44" />
            </clipPath>
        </defs>

        <!-- Rounded Card Container -->
        <g clip-path="url(#cardClip)">
            <!-- Card Background: If Background Image is provided, display it with cover; Otherwise, use background color -->
            ${bgImageBase64 ? `
                <image href="${bgImageBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />
            ` : `
                <rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}" />
            `}

            <!-- 4px Border Overlay (2px at 1x) -->
            <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="44" ry="44" fill="none" stroke="${borderColor}" stroke-width="4" />

            <!-- LEFT COLUMN (padding 44px) -->
            <g transform="translate(44, 44)">
                <!-- BRAND LOGO & BRAND NAME -->
                <g>
                    <!-- White Rounded Box 56x56 (28x28 at 1x, borderRadius 16px) -->
                    <rect x="0" y="0" width="56" height="56" rx="16" ry="16" fill="#FFFFFF" />
                    ${brandLogoBase64 ? `
                        <image href="${brandLogoBase64}" x="4" y="4" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
                    ` : flLogoBase64 ? `
                        <image href="${flLogoBase64}" x="4" y="4" width="48" height="48" preserveAspectRatio="xMidYMid meet" />
                    ` : `
                        <text x="28" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#0E88B8" text-anchor="middle" dominant-baseline="central">FP</text>
                    `}

                    <!-- Brand Name -->
                    <text x="72" y="38" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="32" font-weight="800" fill="${textColor}">
                        ${brandName}
                    </text>
                </g>

                <!-- CARD TITLE -->
                <text x="0" y="94" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      font-size="24" font-weight="700" fill="${textColor}" opacity="0.95">
                    ${cardTitle}
                </text>

                <!-- CARDHOLDER NAME with User Vector Icon -->
                <g transform="translate(0, 114)">
                    <g transform="scale(0.046)">
                        <path d="${SVG_ICONS.user}" fill="${textColor}" opacity="0.9" />
                    </g>
                    <text x="30" y="21" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                          font-size="28" font-weight="700" fill="${textColor}">
                        ${customerName}
                    </text>
                </g>
            </g>

            <!-- TYPE 1: STAMP GRID -->
            ${type === 1 ? stampGridSvg : `
                <!-- TYPE 2: VALID THRU -->
                <g transform="translate(44, 250)">
                    <line x1="0" y1="0" x2="400" y2="0" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
                    <text x="0" y="30" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="${textColor}" opacity="0.85" letter-spacing="1">
                        VALID THRU
                    </text>
                    <text x="0" y="74" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800" fill="${textColor}">
                        ${validity}
                    </text>
                </g>
            `}

            <!-- RIGHT COLUMN: QR CODE CONTAINER (192px width, 184x184 QR Canvas) -->
            <g transform="translate(604, 48)">
                <rect x="0" y="0" width="192" height="192" rx="16" ry="16" fill="#FFFFFF" />
                <g transform="translate(4, 4) scale(4.4)">
                    ${qrSvg}
                </g>

                <!-- SCAN LABEL -->
                <text x="96" y="228" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      font-size="19" font-weight="700" fill="${textColor}" opacity="0.9" text-anchor="middle" letter-spacing="1">
                    ${scanText}
                </text>
            </g>

            <!-- FOOTER: POWERED BY FIRSTLOOP.CO.IN -->
            <g transform="translate(${width - 44}, ${height - 24})">
                <text x="0" y="0" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
                      font-size="19" font-weight="600" fill="${textColor}" opacity="0.9" text-anchor="end">
                    powered by ${flLogoBase64 ? " " : ""}<tspan font-weight="800">firstloop.co.in</tspan>
                </text>
            </g>
        </g>
    </svg>
    `;
  return await sharp(Buffer.from(svgString)).png({ quality: 100 }).toBuffer();
}

// api/card-image.js
async function handler(req, res) {
  try {
    const urlObj = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    let pathId = null;
    const cardImgIdx = pathSegments.findIndex((s) => s === "card-image");
    if (cardImgIdx !== -1 && pathSegments[cardImgIdx + 1]) {
      pathId = pathSegments[cardImgIdx + 1];
    }
    const id = req.query?.id || pathId || urlObj.searchParams.get("id") || "35";
    const type = req.query?.type || urlObj.searchParams.get("type") || "1";
    const cus_id = req.query?.cus_id || req.query?.customer_id || urlObj.searchParams.get("cus_id") || "1";
    const query = Object.fromEntries(urlObj.searchParams.entries());
    const card = await fetchCardData({ id, type, cus_id, query });
    const pngBuffer = await generateCardPngBuffer(card);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", pngBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (typeof res.status === "function") {
      return res.status(200).send(pngBuffer);
    } else {
      res.statusCode = 200;
      return res.end(pngBuffer);
    }
  } catch (err) {
    console.error("Error generating card image:", err);
    if (typeof res.status === "function") {
      return res.status(500).json({ error: "Failed to generate card image", details: err.message });
    } else {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: "Failed to generate card image", details: err.message }));
    }
  }
}

// api/card-preview.js
import fs2 from "fs";
import path2 from "path";
var BOT_USER_AGENTS = /bot|crawler|spider|crawling|whatsapp|facebookexternalhit|facebot|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|applebot|bingbot|googlebot|yandex/i;
async function handler2(req, res) {
  try {
    const urlObj = new URL(req.url, `http://${req.headers?.host || "localhost"}`);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    let pathId = null;
    const cardPreviewIdx = pathSegments.findIndex((s) => s === "card-preview");
    if (cardPreviewIdx !== -1 && pathSegments[cardPreviewIdx + 1]) {
      pathId = pathSegments[cardPreviewIdx + 1];
    }
    const id = req.query?.id || pathId || urlObj.searchParams.get("id") || "35";
    const type = req.query?.type || urlObj.searchParams.get("type") || "1";
    const cus_id = req.query?.cus_id || req.query?.customer_id || urlObj.searchParams.get("cus_id") || "1";
    const userAgent = req.headers?.["user-agent"] || "";
    const isBot = BOT_USER_AGENTS.test(userAgent) || urlObj.searchParams.get("bot") === "1";
    const forwardedProto = req.headers?.["x-forwarded-proto"] || "https";
    const host = req.headers?.["x-forwarded-host"] || req.headers?.host || "localhost:5173";
    const proto = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : forwardedProto;
    const baseUrl = `${proto}://${host}`;
    const query = Object.fromEntries(urlObj.searchParams.entries());
    const card = await fetchCardData({ id, type, cus_id, query });
    const brandName = card.brandName || "FirstPass";
    const cardTitle = card.title || (Number(type) === 2 ? "Membership Pass" : "Stamp Card");
    const ogTitle = `${brandName} - ${cardTitle}`;
    const totalStamps = Number(card.total_stamps || 8);
    const ogDescription = Number(type) === 2 ? card.description || `View your exclusive ${brandName} Membership Pass.` : `Collect ${totalStamps} stamps to earn exclusive rewards at ${brandName}!`;
    const ogImageUrl = `${baseUrl}/api/card-image/${id}?type=${type}&cus_id=${cus_id}`;
    const ogPageUrl = `${baseUrl}/card-preview/${id}?type=${type}&cus_id=${cus_id}`;
    if (isBot) {
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(ogTitle)}</title>
    <meta name="description" content="${escapeHtml(ogDescription)}">
    <meta name="robots" content="index, follow">

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="FirstPass">
    <meta property="og:title" content="${escapeHtml(ogTitle)}">
    <meta property="og:description" content="${escapeHtml(ogDescription)}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:secure_url" content="${ogImageUrl}">
    <meta property="og:image:type" content="image/png">
    <meta property="og:image:width" content="840">
    <meta property="og:image:height" content="480">
    <meta property="og:image:alt" content="${escapeHtml(ogTitle)}">
    <meta property="og:url" content="${ogPageUrl}">

    <!-- Twitter Cards -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@FirstPass">
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
    <meta name="twitter:image" content="${ogImageUrl}">
</head>
<body>
    <p>Viewing <a href="${ogPageUrl}">${escapeHtml(ogTitle)}</a>...</p>
</body>
</html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
      if (typeof res.status === "function") {
        return res.status(200).send(html);
      } else {
        res.statusCode = 200;
        return res.end(html);
      }
    }
    let indexPath = path2.resolve(process.cwd(), "dist", "index.html");
    if (!fs2.existsSync(indexPath)) {
      indexPath = path2.resolve(process.cwd(), "index.html");
    }
    if (fs2.existsSync(indexPath)) {
      let html = fs2.readFileSync(indexPath, "utf-8");
      const injectedMeta = `
    <!-- Dynamic Server-Injected Open Graph Meta -->
    <title>${escapeHtml(ogTitle)}</title>
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(ogTitle)}">
    <meta property="og:description" content="${escapeHtml(ogDescription)}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:url" content="${ogPageUrl}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}">
    <meta name="twitter:image" content="${ogImageUrl}">
`;
      html = html.replace("</head>", `${injectedMeta}
</head>`);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      if (typeof res.status === "function") {
        return res.status(200).send(html);
      } else {
        res.statusCode = 200;
        return res.end(html);
      }
    }
    res.setHeader("Location", `/card-preview/${id}?type=${type}&cus_id=${cus_id}`);
    res.statusCode = 302;
    return res.end();
  } catch (err) {
    console.error("Error handling card-preview request:", err);
    if (typeof res.status === "function") {
      return res.status(500).send("Internal Server Error");
    } else {
      res.statusCode = 500;
      return res.end("Internal Server Error");
    }
  }
}
function escapeHtml(text) {
  if (!text) return "";
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// vite.config.js
var __vite_injected_original_dirname = "D:\\node_js\\dealora\\admin";
function apiDevPlugin() {
  return {
    name: "api-dev-middleware",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || "";
        if (url.startsWith("/api/card-image") || url.startsWith("/card-image") && (req.headers.accept?.includes("image") || req.url.includes("cus_id"))) {
          return handler(req, res);
        }
        if (url.startsWith("/api/card-preview") || url.startsWith("/card-preview") && (req.url.includes("bot=1") || /bot|crawler|spider|whatsapp/i.test(req.headers["user-agent"] || ""))) {
          return handler2(req, res);
        }
        next();
      });
    }
  };
}
var vite_config_default = defineConfig({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    alias: {
      "@/asset": path3.resolve(__vite_injected_original_dirname, "./public/asset"),
      "@": path3.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [
      "firstpassapp.co",
      "www.firstpassapp.co",
      "firstloop.co.in",
      "www.firstloop.co.in"
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAiYXBpL3V0aWxzL2ZldGNoQ2FyZERhdGEuanMiLCAiYXBpL3V0aWxzL2NhcmRTdmdHZW5lcmF0b3IuanMiLCAiYXBpL2NhcmQtaW1hZ2UuanMiLCAiYXBpL2NhcmQtcHJldmlldy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbm9kZV9qc1xcXFxkZWFsb3JhXFxcXGFkbWluXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9ub2RlX2pzL2RlYWxvcmEvYWRtaW4vdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBjYXJkSW1hZ2VIYW5kbGVyIGZyb20gJy4vYXBpL2NhcmQtaW1hZ2UuanMnO1xyXG5pbXBvcnQgY2FyZFByZXZpZXdIYW5kbGVyIGZyb20gJy4vYXBpL2NhcmQtcHJldmlldy5qcyc7XHJcblxyXG4vLyBWaXRlIFBsdWdpbiB0byBtb3VudCBzZXJ2ZXIgZW5kcG9pbnRzIGluIGxvY2FsIGRldmVsb3BtZW50XHJcbmZ1bmN0aW9uIGFwaURldlBsdWdpbigpIHtcclxuICByZXR1cm4ge1xyXG4gICAgbmFtZTogJ2FwaS1kZXYtbWlkZGxld2FyZScsXHJcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoYXN5bmMgKHJlcSwgcmVzLCBuZXh0KSA9PiB7XHJcbiAgICAgICAgY29uc3QgdXJsID0gcmVxLnVybCB8fCAnJztcclxuICAgICAgICBpZiAodXJsLnN0YXJ0c1dpdGgoJy9hcGkvY2FyZC1pbWFnZScpIHx8ICh1cmwuc3RhcnRzV2l0aCgnL2NhcmQtaW1hZ2UnKSAmJiAocmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygnaW1hZ2UnKSB8fCByZXEudXJsLmluY2x1ZGVzKCdjdXNfaWQnKSkpKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2FyZEltYWdlSGFuZGxlcihyZXEsIHJlcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh1cmwuc3RhcnRzV2l0aCgnL2FwaS9jYXJkLXByZXZpZXcnKSB8fCAodXJsLnN0YXJ0c1dpdGgoJy9jYXJkLXByZXZpZXcnKSAmJiAocmVxLnVybC5pbmNsdWRlcygnYm90PTEnKSB8fCAvYm90fGNyYXdsZXJ8c3BpZGVyfHdoYXRzYXBwL2kudGVzdChyZXEuaGVhZGVyc1sndXNlci1hZ2VudCddIHx8ICcnKSkpKSB7XHJcbiAgICAgICAgICByZXR1cm4gY2FyZFByZXZpZXdIYW5kbGVyKHJlcSwgcmVzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbmV4dCgpO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBhcGlEZXZQbHVnaW4oKV0sXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgJ0AvYXNzZXQnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9wdWJsaWMvYXNzZXQnKSxcclxuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6ICcwLjAuMC4wJyxcclxuICAgIHBvcnQ6IDUxNzMsXHJcbiAgICBhbGxvd2VkSG9zdHM6IFtcclxuICAgICAgJ2ZpcnN0cGFzc2FwcC5jbycsXHJcbiAgICAgICd3d3cuZmlyc3RwYXNzYXBwLmNvJyxcclxuICAgICAgJ2ZpcnN0bG9vcC5jby5pbicsXHJcbiAgICAgICd3d3cuZmlyc3Rsb29wLmNvLmluJyxcclxuXHJcbiAgICBdXHJcbiAgfVxyXG59KTsiLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblxcXFxhcGlcXFxcdXRpbHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblxcXFxhcGlcXFxcdXRpbHNcXFxcZmV0Y2hDYXJkRGF0YS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovbm9kZV9qcy9kZWFsb3JhL2FkbWluL2FwaS91dGlscy9mZXRjaENhcmREYXRhLmpzXCI7aW1wb3J0IGF4aW9zIGZyb20gJ2F4aW9zJztcclxuXHJcbi8vIEhlbHBlcjogQ2xlYW4gcmVsYXRpdmUgaW1hZ2UgcGF0aFxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVsYXRpdmVJbWFnZVBhdGgodmFsdWUpIHtcclxuICAgIGlmICghdmFsdWUpIHJldHVybiAnJztcclxuICAgIGxldCBzdHIgPSBTdHJpbmcodmFsdWUpLnRyaW0oKTtcclxuXHJcbiAgICBpZiAoc3RyLnN0YXJ0c1dpdGgoJ2RhdGE6JykgfHwgc3RyLnN0YXJ0c1dpdGgoJ2Jsb2I6JykpIHtcclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHVwbG9hZHNNYXRjaCA9IHN0ci5tYXRjaCgvKHVwbG9hZHNcXC8uKikvaSk7XHJcbiAgICBpZiAodXBsb2Fkc01hdGNoKSB7XHJcbiAgICAgICAgcmV0dXJuIHVwbG9hZHNNYXRjaFsxXS5yZXBsYWNlKC9eXFwvKy8sICcnKTtcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSAoc3RyLmluY2x1ZGVzKCdodHRwOi8vJykgfHwgc3RyLmluY2x1ZGVzKCdodHRwczovLycpKSB7XHJcbiAgICAgICAgY29uc3QgbGFzdEh0dHAgPSBzdHIubGFzdEluZGV4T2YoJ2h0dHA6Ly8nKTtcclxuICAgICAgICBjb25zdCBsYXN0SHR0cHMgPSBzdHIubGFzdEluZGV4T2YoJ2h0dHBzOi8vJyk7XHJcbiAgICAgICAgY29uc3QgaWR4ID0gTWF0aC5tYXgobGFzdEh0dHAsIGxhc3RIdHRwcyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChzdHIuc3Vic3RyaW5nKGlkeCkpO1xyXG4gICAgICAgICAgICBzdHIgPSB1cmwucGF0aG5hbWU7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXmh0dHBzPzpcXC9cXC9bXi9dKy9pLCAnJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvXlxcLysvLCAnJyk7XHJcbn1cclxuXHJcbi8vIEhlbHBlcjogRm9ybWF0IGltYWdlIFVSTCB3aXRoIGJhc2UgQVBJIFVSTFxyXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0SW1hZ2VVcmwoaW1nLCBiYXNlVXJsKSB7XHJcbiAgICBpZiAoIWltZykgcmV0dXJuICcnO1xyXG4gICAgbGV0IHN0ciA9IFN0cmluZyhpbWcpLnRyaW0oKTtcclxuXHJcbiAgICBpZiAoc3RyID09PSAnbm9uZScgfHwgc3RyID09PSAnbnVsbCcgfHwgc3RyID09PSAndW5kZWZpbmVkJyB8fCBzdHIgPT09ICdmYWxzZScpIHtcclxuICAgICAgICByZXR1cm4gJyc7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHN0ci5zdGFydHNXaXRoKCdodHRwOi8vJykgfHwgc3RyLnN0YXJ0c1dpdGgoJ2h0dHBzOi8vJykgfHwgc3RyLnN0YXJ0c1dpdGgoJ2RhdGE6JykgfHwgc3RyLnN0YXJ0c1dpdGgoJ2Jsb2I6JykpIHtcclxuICAgICAgICByZXR1cm4gc3RyO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlbCA9IGdldFJlbGF0aXZlSW1hZ2VQYXRoKHN0cik7XHJcbiAgICBpZiAoIXJlbCkgcmV0dXJuICcnO1xyXG5cclxuICAgIGNvbnN0IGNsZWFuQmFzZSA9IChiYXNlVXJsIHx8ICcnKS5yZXBsYWNlKC9cXC8rJC8sICcnKTtcclxuICAgIGNvbnN0IGNsZWFuSW1nID0gcmVsLnJlcGxhY2UoL15cXC8rLywgJycpO1xyXG4gICAgcmV0dXJuIGNsZWFuQmFzZSA/IGAke2NsZWFuQmFzZX0vJHtjbGVhbkltZ31gIDogY2xlYW5JbWc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTdGFuZGFyZCBOb2RlLmpzIGhlbHBlciB0byBmZXRjaCBjYXJkIGRhdGEgZnJvbSBEZWFsb3JhIEFQSVxyXG4gKiBDb21wYXRpYmxlIHdpdGggTG9jYWxob3N0LCBWZXJjZWwsIGFuZCBEaWdpdGFsT2NlYW5cclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaENhcmREYXRhKHsgaWQsIHR5cGUgPSAxLCBjdXNfaWQgPSAxLCBxdWVyeSA9IHt9IH0pIHtcclxuICAgIGNvbnN0IGNhcmRJZCA9IE51bWJlcihpZCkgfHwgMTtcclxuICAgIGNvbnN0IGNhcmRUeXBlID0gTnVtYmVyKHR5cGUpID09PSAyID8gMiA6IDE7XHJcbiAgICBjb25zdCBjdXN0b21lcklkID0gTnVtYmVyKGN1c19pZCkgfHwgMTtcclxuXHJcbiAgICAvLyBSZXNvbHZlIEFQSSBCYXNlIFVSTFxyXG4gICAgY29uc3QgYmFzZVVybCA9IChcclxuICAgICAgICBwcm9jZXNzLmVudi5WSVRFX0FQSV9VUkwgfHxcclxuICAgICAgICBwcm9jZXNzLmVudi5BUElfVVJMIHx8XHJcbiAgICAgICAgJ2h0dHBzOi8vZGVhbG9yYS03c3Q5Lm9ucmVuZGVyLmNvbSdcclxuICAgICkucmVwbGFjZSgvXFwvKyQvLCAnJyk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBwYXlsb2FkID0ge1xyXG4gICAgICAgICAgICBpZDogY2FyZElkLFxyXG4gICAgICAgICAgICB0eXBlOiBjYXJkVHlwZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgaWYgKGN1c3RvbWVySWQpIHtcclxuICAgICAgICAgICAgcGF5bG9hZC5jdXNfaWQgPSBjdXN0b21lcklkO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5wb3N0KGAke2Jhc2VVcmx9L2ZpcnN0bG9vcC9jdXN0b21lci9mZXRjaC1jYXJkYCwgcGF5bG9hZCwge1xyXG4gICAgICAgICAgICB0aW1lb3V0OiA2MDAwLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICAgICAgJ1gtU2tpcC1BdXRoLVJlZGlyZWN0JzogJ3RydWUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlPy5kYXRhPy5zdGF0dXMgPT09IDEgJiYgcmVzcG9uc2U/LmRhdGE/LmRhdGEpIHtcclxuICAgICAgICAgICAgY29uc3QgcmF3ID0gcmVzcG9uc2UuZGF0YS5kYXRhO1xyXG4gICAgICAgICAgICBjb25zdCBpdGVtID0gQXJyYXkuaXNBcnJheShyYXcpID8gcmF3WzBdIDogcmF3O1xyXG5cclxuICAgICAgICAgICAgaWYgKGl0ZW0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHRvdGFsU3RhbXBzID0gTnVtYmVyKGl0ZW0ubnVtYmVyX29mX3N0YW1wcyB8fCBpdGVtLnRvdGFsX3N0YW1wcyB8fCA4KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IEN1c3RvbWVyU3RhbXBMZXZlbHMgPSBBcnJheS5pc0FycmF5KGl0ZW0uQ3VzdG9tZXJTdGFtcExldmVscylcclxuICAgICAgICAgICAgICAgICAgICA/IGl0ZW0uQ3VzdG9tZXJTdGFtcExldmVsc1xyXG4gICAgICAgICAgICAgICAgICAgIDogQXJyYXkuaXNBcnJheShpdGVtLnN0YW1wX2xldmVscylcclxuICAgICAgICAgICAgICAgICAgICAgICAgPyBpdGVtLnN0YW1wX2xldmVsc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxldmVsUmV3YXJkcyA9IEN1c3RvbWVyU3RhbXBMZXZlbHMubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAgICAgICAgID8gQ3VzdG9tZXJTdGFtcExldmVscy5tYXAoKGx2bCwgaWR4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJhd1R5cGUgPSBTdHJpbmcobHZsLnJld2FyZF90eXBlID8/IGx2bC50eXBlID8/ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgaXNEaXNjb3VudCA9IHJhd1R5cGUgPT09ICcyJyB8fCByYXdUeXBlID09PSAnZGlzY291bnQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1BhaWQgPSByYXdUeXBlID09PSAnMycgfHwgcmF3VHlwZSA9PT0gJ3BhaWQnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByVHlwZSA9IGlzRGlzY291bnQgPyAnRGlzY291bnQnIDogaXNQYWlkID8gJ1BhaWQnIDogJ0ZyZWUnO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBOdW1iZXIobHZsLmlkIHx8IGx2bC5zdGFtcF9sZXZlbF9pZCB8fCAwKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YW1wX251bWJlcjogTnVtYmVyKGx2bC5zdGFtcF9udW1iZXIgfHwgbHZsLnN0YW1wKSB8fCBpZHggKyAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBOdW1iZXIobHZsLnN0YXR1cykgfHwgMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJld2FyZDogbHZsLnJld2FyZF90ZXh0IHx8IChpc0Rpc2NvdW50ID8gJ0Rpc2NvdW50JyA6IGlzUGFpZCA/ICdQYWlkJyA6ICdGcmVlIEl0ZW0nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHJUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzY291bnRWYWw6IGlzRGlzY291bnQgPyBwYXJzZUZsb2F0KGx2bC5kaXNjb3VudCA/PyBsdmwuZGlzY291bnRWYWwgPz8gMTApIDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb246IGx2bC5pY29uIHx8IChpc0Rpc2NvdW50ID8gJ2ZhLXBlcmNlbnQnIDogaXNQYWlkID8gJ2ZhLXRhZycgOiAnZmEtZ2lmdCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW10OiBOdW1iZXIobHZsLmFtdCkgfHwgMFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgOiBBcnJheS5mcm9tKHsgbGVuZ3RoOiB0b3RhbFN0YW1wcyB9KS5tYXAoKF8sIGkpID0+ICh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFtcF9udW1iZXI6IGkgKyAxLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGkgPCBOdW1iZXIoaXRlbS5jdXJyZW50X3N0YW1wID8/IGl0ZW0uY29sbGVjdGVkID8/IDApID8gMSA6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJld2FyZDogYFN0YW1wICMke2kgKyAxfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdGcmVlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzY291bnRWYWw6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGljb246ICdmYS1naWZ0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYW10OiAwXHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGJyYW5kTG9nb1JhdyA9IGl0ZW0uYnJhbmRfaW1hZ2UgfHwgaXRlbS5icmFuZF9sb2dvO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmdJbWFnZVJhdyA9IGl0ZW0uYmFja2dyb3VuZF9pbWFnZSB8fCBpdGVtLmJnX2ltYWdlIHx8IGl0ZW0uYmdJbWFnZTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBjYXJkSWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FyZF90eXBlOiBjYXJkVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogaXRlbS50aXRsZSB8fCAoY2FyZFR5cGUgPT09IDIgPyAnVklQIE1lbWJlcnNoaXAgUGFzcycgOiAnTG95YWx0eSBTdGFtcCBDYXJkJyksXHJcbiAgICAgICAgICAgICAgICAgICAgYnJhbmROYW1lOiBpdGVtLmJyYW5kX25hbWUgfHwgJ0ZpcnN0UGFzcycsXHJcbiAgICAgICAgICAgICAgICAgICAgYnJhbmRMb2dvOiBmb3JtYXRJbWFnZVVybChicmFuZExvZ29SYXcsIGJhc2VVcmwpLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvdGFsX3N0YW1wczogdG90YWxTdGFtcHMsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FyZGhvbGRlck5hbWU6IGl0ZW0uY3VzdG9tZXJfbmFtZSB8fCBpdGVtLmN1c3RvbWVyPy5uYW1lIHx8ICdDdXN0b21lcicsXHJcbiAgICAgICAgICAgICAgICAgICAgYmdDb2xvcjogaXRlbS5iYWNrZ3JvdW5kX2NvbG9yIHx8IChjYXJkVHlwZSA9PT0gMiA/ICcjRDk3NzA2JyA6ICcjMEU4OEI4JyksXHJcbiAgICAgICAgICAgICAgICAgICAgYmdJbWFnZTogZm9ybWF0SW1hZ2VVcmwoYmdJbWFnZVJhdywgYmFzZVVybCksXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dENvbG9yOiBpdGVtLnRleHRfY29sb3IgfHwgJyNGRkZGRkYnLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiBpdGVtLmJvcmRlcl9jb2xvciB8fCAoY2FyZFR5cGUgPT09IDIgPyAnI0ZGRkZGRicgOiAnIzAwQTZENicpLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YW1wQmdDb2xvcjogaXRlbS5zdGFtcF9iYWNrZ3JvdW5kIHx8ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMyknLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YW1wQm9yZGVyQ29sb3I6IGl0ZW0uc3RhbXBfYm9yZGVyX2NvbG9yIHx8ICcjRkZGRkZGJyxcclxuICAgICAgICAgICAgICAgICAgICBzdGFtcFRleHRDb2xvcjogaXRlbS5zdGFtcF90ZXh0X2NvbG9yIHx8ICcjRkZGRkZGJyxcclxuICAgICAgICAgICAgICAgICAgICBzdGFtcF9yYWRpdXM6IE51bWJlcihpdGVtLnN0YW1wX3JhZGl1cyA/PyA1MCksXHJcbiAgICAgICAgICAgICAgICAgICAgcXJfdG9rZW46IGl0ZW0ucXJfdG9rZW4gfHwgYGRlYWxvcmEtY2FyZC0ke2NhcmRJZH0tJHtjdXN0b21lcklkfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgQ3VzdG9tZXJTdGFtcExldmVscyxcclxuICAgICAgICAgICAgICAgICAgICBsZXZlbFJld2FyZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsaWRpdHk6IGl0ZW0udmFsaWRpdHkgfHwgJzEyIE1vbnRocycsXHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGl0ZW0uZGVzY3JpcHRpb24gfHwgJydcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ2ZldGNoQ2FyZERhdGEgQVBJIGZhaWxlZCBvciB0aW1lZCBvdXQsIHVzaW5nIGZhbGxiYWNrIHBhcmFtZXRlcnM6JywgZXJyLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZhbGxiYWNrIGZyb20gcXVlcnkgcGFyYW1ldGVyc1xyXG4gICAgY29uc3QgdG90YWxTdGFtcHMgPSBOdW1iZXIocXVlcnkuc3RhbXBzIHx8IHF1ZXJ5LnRvdGFsX3N0YW1wcyB8fCA4KTtcclxuICAgIGNvbnN0IGRpc2NvdW50VmFsID0gcXVlcnkuZGlzY291bnQgfHwgcXVlcnkuZGlzY291bnRWYWwgfHwgJzEwJztcclxuICAgIGNvbnN0IHF1ZXJ5QmdJbWFnZSA9IHF1ZXJ5LmJnSW1hZ2UgfHwgcXVlcnkuYmdfaW1hZ2UgfHwgcXVlcnkuYmFja2dyb3VuZF9pbWFnZSB8fCAnJztcclxuICAgIGNvbnN0IHF1ZXJ5TG9nbyA9IHF1ZXJ5LmxvZ28gfHwgcXVlcnkuYnJhbmRfbG9nbyB8fCBxdWVyeS5icmFuZF9pbWFnZSB8fCAnJztcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGlkOiBjYXJkSWQsXHJcbiAgICAgICAgY2FyZF90eXBlOiBjYXJkVHlwZSxcclxuICAgICAgICB0aXRsZTogcXVlcnkudGl0bGUgfHwgKGNhcmRUeXBlID09PSAyID8gJ01lbWJlcnNoaXAgUGFzcycgOiAnRGlnaXRhbCBTdGFtcCBDYXJkJyksXHJcbiAgICAgICAgYnJhbmROYW1lOiBxdWVyeS5icmFuZCB8fCBxdWVyeS5icmFuZF9uYW1lIHx8ICdGaXJzdFBhc3MnLFxyXG4gICAgICAgIGJyYW5kTG9nbzogZm9ybWF0SW1hZ2VVcmwocXVlcnlMb2dvLCBiYXNlVXJsKSxcclxuICAgICAgICB0b3RhbF9zdGFtcHM6IHRvdGFsU3RhbXBzLFxyXG4gICAgICAgIGNhcmRob2xkZXJOYW1lOiBxdWVyeS5uYW1lIHx8IHF1ZXJ5LmN1c3RvbWVyX25hbWUgfHwgJ0N1c3RvbWVyJyxcclxuICAgICAgICBiZ0NvbG9yOiBxdWVyeS5iZ0NvbG9yIHx8IHF1ZXJ5LmJnX2NvbG9yIHx8IChjYXJkVHlwZSA9PT0gMiA/ICcjRDk3NzA2JyA6ICcjMEU4OEI4JyksXHJcbiAgICAgICAgYmdJbWFnZTogZm9ybWF0SW1hZ2VVcmwocXVlcnlCZ0ltYWdlLCBiYXNlVXJsKSxcclxuICAgICAgICB0ZXh0Q29sb3I6IHF1ZXJ5LnRleHRDb2xvciB8fCAnI0ZGRkZGRicsXHJcbiAgICAgICAgYm9yZGVyQ29sb3I6IHF1ZXJ5LmJvcmRlckNvbG9yIHx8IHF1ZXJ5LmJvcmRlcl9jb2xvciB8fCAnI0ZGRkZGRicsXHJcbiAgICAgICAgc3RhbXBCZ0NvbG9yOiBxdWVyeS5zdGFtcEJnQ29sb3IgfHwgJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4zKScsXHJcbiAgICAgICAgc3RhbXBCb3JkZXJDb2xvcjogcXVlcnkuc3RhbXBCb3JkZXJDb2xvciB8fCAnI0ZGRkZGRicsXHJcbiAgICAgICAgc3RhbXBUZXh0Q29sb3I6IHF1ZXJ5LnN0YW1wVGV4dENvbG9yIHx8ICcjRkZGRkZGJyxcclxuICAgICAgICBzdGFtcF9yYWRpdXM6IDUwLFxyXG4gICAgICAgIHFyX3Rva2VuOiBxdWVyeS5xciB8fCBgZGVhbG9yYS1jYXJkLSR7Y2FyZElkfS0ke2N1c3RvbWVySWR9YCxcclxuICAgICAgICBsZXZlbFJld2FyZHM6IEFycmF5LmZyb20oeyBsZW5ndGg6IHRvdGFsU3RhbXBzIH0pLm1hcCgoXywgaSkgPT4gKHtcclxuICAgICAgICAgICAgc3RhbXBfbnVtYmVyOiBpICsgMSxcclxuICAgICAgICAgICAgcmV3YXJkOiBpICsgMSA9PT0gdG90YWxTdGFtcHMgPyBgJHtkaXNjb3VudFZhbH0lIE9GRiBSZXdhcmRgIDogJ0ZyZWUgUmV3YXJkJyxcclxuICAgICAgICAgICAgdHlwZTogaSArIDEgPT09IHRvdGFsU3RhbXBzID8gJ0Rpc2NvdW50JyA6ICdGcmVlJyxcclxuICAgICAgICAgICAgZGlzY291bnRWYWw6IGkgKyAxID09PSB0b3RhbFN0YW1wcyA/IE51bWJlcihkaXNjb3VudFZhbCkgOiAwLFxyXG4gICAgICAgICAgICBpY29uOiAnZmEtZ2lmdCcsXHJcbiAgICAgICAgICAgIHN0YXR1czogMFxyXG4gICAgICAgIH0pKSxcclxuICAgICAgICB2YWxpZGl0eTogcXVlcnkudmFsaWRpdHkgfHwgJzEyIE1vbnRocycsXHJcbiAgICAgICAgZGVzY3JpcHRpb246IHF1ZXJ5LmRlc2NyaXB0aW9uIHx8ICcnXHJcbiAgICB9O1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcbm9kZV9qc1xcXFxkZWFsb3JhXFxcXGFkbWluXFxcXGFwaVxcXFx1dGlsc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcbm9kZV9qc1xcXFxkZWFsb3JhXFxcXGFkbWluXFxcXGFwaVxcXFx1dGlsc1xcXFxjYXJkU3ZnR2VuZXJhdG9yLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9ub2RlX2pzL2RlYWxvcmEvYWRtaW4vYXBpL3V0aWxzL2NhcmRTdmdHZW5lcmF0b3IuanNcIjtpbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHNoYXJwIGZyb20gJ3NoYXJwJztcclxuaW1wb3J0IFFSQ29kZSBmcm9tICdxcmNvZGUnO1xyXG5pbXBvcnQgYXhpb3MgZnJvbSAnYXhpb3MnO1xyXG5cclxuLy8gRm9udEF3ZXNvbWUgNiBTVkcgVmVjdG9yIFBhdGhzXHJcbmNvbnN0IFNWR19JQ09OUyA9IHtcclxuICAgIHVzZXI6ICdNMjI0IDI1NkExMjggMTI4IDAgMSAwIDIyNCAwYTEyOCAxMjggMCAxIDAgMCAyNTZ6bS00NS43IDQ4Qzc5LjggMzA0IDAgMzgzLjggMCA0ODIuM0MwIDQ5OC43IDEzLjMgNTEyIDI5LjcgNTEySDQxOC4zYzE2LjQgMCAyOS43LTEzLjMgMjkuNy0yOS43QzQ0OCAzODMuOCAzNjguMiAzMDQgMjY5LjcgMzA0SDE3OC4zeicsXHJcbiAgICBnaWZ0OiAnTTExMiAwYTY0IDY0IDAgMCAwIC02NCA2NHYzMkgxNkM3LjIgOTYgMCAxMDMuMiAwIDExMnY0OGMwIDguOCA3LjIgMTYgMTYgMTZoMTZ2MjcyYzAgMzUuMyAyOC43IDY0IDY0IDY0aDMyMGMzNS4zIDAgNjQtMjguNyA2NC02NFYxNzZoMTZjOC44IDAgMTYtNy4yIDE2LTE2VjExMmMwLTguOC03LjItMTYtMTYtMTZoLTMyVjY0YTY0IDY0IDAgMCAwIC02NC02NEgxMTJ6TTI4OCA5NlY2NGEzMiAzMiAwIDAgMSAzMi0zMmg2NGEzMiAzMiAwIDAgMSAzMiAzMnYzMkgyODh6TTIyNCA5Nkg5NlY2NGEzMiAzMiAwIDAgMSAzMi0zMmg2NGEzMiAzMiAwIDAgMSAzMiAzMnYzMnpNODAgMTc2aDE0NHYyODhIOTZjLTE3LjcgMC0zMi0xNC4zLTMyLTMyVjE3NmgxNnptMjA4IDI4OFYxNzZoMTQ0djI1NmMwIDE3LjctMTQuMyAzMi0zMiAzMkgyODh6JyxcclxuICAgIHRhZzogJ00wIDgwVjIyOS41YzAgMTcgNi43IDMzLjMgMTguNyA0NS4zbDE5MiAxOTJjMjUgMjUgNjUuNSAyNSA5MC41IDBMNDY3LjUgMzAwLjVjMjUtMjUgMjUtNjUuNSAwLTkwLjVsLTE5Mi0xOTJDMjYzLjUgNi43IDI0Ny4yIDAgMjMwLjIgMEg4MEMzNS44IDAgMCAzNS44IDAgODB6bTExMiA0OGE0OCA0OCAwIDEgMSAwLTk2IDQ4IDQ4IDAgMSAxIDAgOTZ6J1xyXG59O1xyXG5cclxuLy8gSGVscGVyOiBFc2NhcGUgWE1MIGVudGl0aWVzXHJcbmZ1bmN0aW9uIGVzY2FwZVhtbCh1bnNhZmUpIHtcclxuICAgIGlmICghdW5zYWZlKSByZXR1cm4gJyc7XHJcbiAgICByZXR1cm4gU3RyaW5nKHVuc2FmZSlcclxuICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxyXG4gICAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcclxuICAgICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXHJcbiAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxyXG4gICAgICAgIC5yZXBsYWNlKC8nL2csICcmYXBvczsnKTtcclxufVxyXG5cclxuLy8gSGVscGVyOiBDb252ZXJ0IHJlbW90ZSBpbWFnZSBvciBsb2NhbCBmaWxlIHRvIGJhc2U2NCBQTkcgRGF0YSBVUkxcclxuYXN5bmMgZnVuY3Rpb24gZ2V0QmFzZTY0SW1hZ2UoaW1hZ2VVcmwpIHtcclxuICAgIGlmICghaW1hZ2VVcmwpIHJldHVybiBudWxsO1xyXG4gICAgaWYgKGltYWdlVXJsLnN0YXJ0c1dpdGgoJ2RhdGE6aW1hZ2UvJykpIHJldHVybiBpbWFnZVVybDtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBheGlvcy5nZXQoaW1hZ2VVcmwsIHtcclxuICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAnYXJyYXlidWZmZXInLFxyXG4gICAgICAgICAgICB0aW1lb3V0OiA1MDAwXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gQ29udmVydCBhbnkgZm9ybWF0IChpbmNsdWRpbmcgV2ViUCwgSlBFRywgR0lGKSB0byBzdGFuZGFyZCBQTkcgYnVmZmVyIHZpYSBTaGFycFxyXG4gICAgICAgIGNvbnN0IHBuZ0J1ZiA9IGF3YWl0IHNoYXJwKEJ1ZmZlci5mcm9tKHJlc3BvbnNlLmRhdGEpKS5wbmcoKS50b0J1ZmZlcigpO1xyXG4gICAgICAgIHJldHVybiBgZGF0YTppbWFnZS9wbmc7YmFzZTY0LCR7cG5nQnVmLnRvU3RyaW5nKCdiYXNlNjQnKX1gO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUud2FybignQ291bGQgbm90IGZldGNoIG9yIGNvbnZlcnQgYmFja2dyb3VuZC9icmFuZCBpbWFnZTonLCBpbWFnZVVybCwgZS5tZXNzYWdlKTtcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxufVxyXG5cclxuLy8gUHJlLWxvYWQgbG9jYWwgRmlyc3RMb29wIGZhdmljb24gYmFzZTY0XHJcbmxldCBjYWNoZWRGbExvZ29CYXNlNjQgPSBudWxsO1xyXG5mdW5jdGlvbiBnZXRMb2NhbEZpcnN0TG9vcExvZ28oKSB7XHJcbiAgICBpZiAoY2FjaGVkRmxMb2dvQmFzZTY0KSByZXR1cm4gY2FjaGVkRmxMb2dvQmFzZTY0O1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBsb2dvUGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnc3JjJywgJ2Fzc2V0cycsICdpbWcnLCAnZmlyc3Rsb29wLWZhdmljb24ucG5nJyk7XHJcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMobG9nb1BhdGgpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1ZiA9IGZzLnJlYWRGaWxlU3luYyhsb2dvUGF0aCk7XHJcbiAgICAgICAgICAgIGNhY2hlZEZsTG9nb0Jhc2U2NCA9IGBkYXRhOmltYWdlL3BuZztiYXNlNjQsJHtidWYudG9TdHJpbmcoJ2Jhc2U2NCcpfWA7XHJcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRGbExvZ29CYXNlNjQ7XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge31cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG4vKipcclxuICogR2VuZXJhdGUgYSAxOjEgc2VydmVyLXNpZGUgUE5HIHJlcHJvZHVjdGlvbiBvZiBDdXN0b21lckNhcmQuanN4XHJcbiAqIERpbWVuc2lvbnM6IDg0MCB4IDQ4MCAoMnggaGlnaC1yZXNvbHV0aW9uIHJldGluYSBidWZmZXIgZm9yIGNyaXNwIHJlbmRlcmluZylcclxuICovXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZW5lcmF0ZUNhcmRQbmdCdWZmZXIoY2FyZCkge1xyXG4gICAgY29uc3Qgd2lkdGggPSA4NDA7XHJcbiAgICBjb25zdCBoZWlnaHQgPSA0ODA7XHJcbiAgICBjb25zdCB0eXBlID0gTnVtYmVyKGNhcmQuY2FyZF90eXBlIHx8IDEpID09PSAyID8gMiA6IDE7XHJcblxyXG4gICAgLy8gQ2FyZCBDb2xvcnMgJiBEaW1lbnNpb25zIG1hdGNoaW5nIEN1c3RvbWVyQ2FyZC5qc3hcclxuICAgIGNvbnN0IGRlZmF1bHRCZyA9IHR5cGUgPT09IDIgPyAnI0Q5NzcwNicgOiAnIzBFODhCOCc7XHJcbiAgICBjb25zdCBiZ0NvbG9yID0gY2FyZC5iZ0NvbG9yIHx8IGRlZmF1bHRCZztcclxuICAgIGNvbnN0IGJvcmRlckNvbG9yID0gY2FyZC5ib3JkZXJDb2xvciB8fCAodHlwZSA9PT0gMiA/ICcjRkZGRkZGJyA6ICcjMDBBNkQ2Jyk7XHJcbiAgICBjb25zdCB0ZXh0Q29sb3IgPSBjYXJkLnRleHRDb2xvciB8fCAnI0ZGRkZGRic7XHJcbiAgICBjb25zdCB0b3RhbFN0YW1wcyA9IE51bWJlcihjYXJkLnRvdGFsX3N0YW1wcyB8fCBjYXJkLm51bWJlcl9vZl9zdGFtcHMgfHwgOCk7XHJcbiAgICBjb25zdCBzdGFtcFJhZGl1c1BlcmNlbnQgPSBOdW1iZXIoY2FyZC5zdGFtcF9yYWRpdXMgPz8gNTApO1xyXG4gICAgY29uc3Qgc3RhbXBCb3JkZXJSYWRpdXMgPSAoc3RhbXBSYWRpdXNQZXJjZW50IC8gMTAwKSAqIDM2OyAvLyA3MnB4IHN0YW1wIHdpZHRoXHJcblxyXG4gICAgY29uc3Qgc3RhbXBCZ0NvbG9yID0gY2FyZC5zdGFtcEJnQ29sb3IgfHwgJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4zKSc7XHJcbiAgICBjb25zdCBzdGFtcEJvcmRlckNvbG9yID0gY2FyZC5zdGFtcEJvcmRlckNvbG9yIHx8ICcjRkZGRkZGJztcclxuICAgIGNvbnN0IHN0YW1wVGV4dENvbG9yID0gY2FyZC5zdGFtcFRleHRDb2xvciB8fCB0ZXh0Q29sb3I7XHJcblxyXG4gICAgY29uc3QgYnJhbmROYW1lID0gZXNjYXBlWG1sKGNhcmQuYnJhbmROYW1lIHx8ICdNZXJjaGFudCcpO1xyXG4gICAgY29uc3QgY2FyZFRpdGxlID0gZXNjYXBlWG1sKGNhcmQudGl0bGUgfHwgKHR5cGUgPT09IDIgPyAnTWVtYmVyc2hpcCBQYXNzJyA6ICdTdGFtcCBQYXNzJykpO1xyXG4gICAgY29uc3QgY3VzdG9tZXJOYW1lID0gZXNjYXBlWG1sKGNhcmQuY2FyZGhvbGRlck5hbWUgfHwgY2FyZC5jdXN0b21lcl9uYW1lIHx8ICh0eXBlID09PSAyID8gJ01lbWJlciBQYXNzJyA6ICdTdGFtcCBQYXNzJykpO1xyXG4gICAgY29uc3QgdmFsaWRpdHkgPSBlc2NhcGVYbWwoY2FyZC52YWxpZGl0eSB8fCAnMTIgTW9udGhzJyk7XHJcbiAgICBjb25zdCBzY2FuVGV4dCA9IHR5cGUgPT09IDIgPyAnU0NBTiBQQVNTJyA6ICdTQ0FOIFRPIFNUQU1QJztcclxuXHJcbiAgICAvLyAxLiBHZW5lcmF0ZSBRUiBDb2RlIE1hdHJpeFxyXG4gICAgY29uc3QgcXJEYXRhID0gY2FyZC5xcl90b2tlbiB8fCBjYXJkLnFySW1nIHx8IGBkZWFsb3JhLSR7Y2FyZC5pZCB8fCAxfWA7XHJcbiAgICBsZXQgcXJTdmcgPSAnJztcclxuICAgIHRyeSB7XHJcbiAgICAgICAgcXJTdmcgPSBhd2FpdCBRUkNvZGUudG9TdHJpbmcocXJEYXRhLCB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdzdmcnLFxyXG4gICAgICAgICAgICBtYXJnaW46IDAsXHJcbiAgICAgICAgICAgIGNvbG9yOiB7XHJcbiAgICAgICAgICAgICAgICBkYXJrOiAnIzAwMDAwMCcsXHJcbiAgICAgICAgICAgICAgICBsaWdodDogJyNGRkZGRkYnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICBxclN2ZyA9IHFyU3ZnLnJlcGxhY2UoLzxcXD94bWwuKj9cXD8+LywgJycpLnJlcGxhY2UoLzxzdmdbXj5dKj4vLCAnJykucmVwbGFjZSgvPFxcL3N2Zz4vLCAnJyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ1FSIENvZGUgZ2VuZXJhdGlvbiBlcnJvcjonLCBlcnIubWVzc2FnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gMi4gRmV0Y2ggQnJhbmQgTG9nbyAmIEJhY2tncm91bmQgSW1hZ2VcclxuICAgIGxldCBicmFuZExvZ29CYXNlNjQgPSBudWxsO1xyXG4gICAgaWYgKGNhcmQuYnJhbmRMb2dvKSB7XHJcbiAgICAgICAgYnJhbmRMb2dvQmFzZTY0ID0gYXdhaXQgZ2V0QmFzZTY0SW1hZ2UoY2FyZC5icmFuZExvZ28pO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBiZ0ltYWdlQmFzZTY0ID0gbnVsbDtcclxuICAgIGlmIChjYXJkLmJnSW1hZ2UgJiYgY2FyZC5iZ0ltYWdlICE9PSAnbm9uZScgJiYgY2FyZC5iZ0ltYWdlICE9PSAnbnVsbCcgJiYgY2FyZC5iZ0ltYWdlICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgIGJnSW1hZ2VCYXNlNjQgPSBhd2FpdCBnZXRCYXNlNjRJbWFnZShjYXJkLmJnSW1hZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZsTG9nb0Jhc2U2NCA9IGdldExvY2FsRmlyc3RMb29wTG9nbygpO1xyXG5cclxuICAgIC8vIDMuIEJ1aWxkIFN0YW1wIEdyaWQgRWxlbWVudHMgKFR5cGUgMSlcclxuICAgIGxldCBzdGFtcEdyaWRTdmcgPSAnJztcclxuICAgIGlmICh0eXBlID09PSAxKSB7XHJcbiAgICAgICAgY29uc3QgbGV2ZWxzID0gY2FyZC5sZXZlbFJld2FyZHMgfHwgY2FyZC5DdXN0b21lclN0YW1wTGV2ZWxzIHx8IGNhcmQuc3RhbXBfbGV2ZWxzIHx8IFtdO1xyXG4gICAgICAgIGNvbnN0IHN0YW1wVyA9IDcyO1xyXG4gICAgICAgIGNvbnN0IHN0YW1wSCA9IDcyO1xyXG4gICAgICAgIGNvbnN0IGdhcFggPSAxMjtcclxuICAgICAgICBjb25zdCBnYXBZID0gMTI7XHJcbiAgICAgICAgY29uc3QgbWF4Q29scyA9IDU7XHJcbiAgICAgICAgY29uc3Qgc3RhcnRYID0gNDQ7XHJcbiAgICAgICAgY29uc3Qgc3RhcnRZID0gMTk2O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsU3RhbXBzOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgY29sID0gaSAlIG1heENvbHM7XHJcbiAgICAgICAgICAgIGNvbnN0IHJvdyA9IE1hdGguZmxvb3IoaSAvIG1heENvbHMpO1xyXG4gICAgICAgICAgICBjb25zdCB4ID0gc3RhcnRYICsgY29sICogKHN0YW1wVyArIGdhcFgpO1xyXG4gICAgICAgICAgICBjb25zdCB5ID0gc3RhcnRZICsgcm93ICogKHN0YW1wSCArIGdhcFkpO1xyXG5cclxuICAgICAgICAgICAgY29uc3Qgc3RhbXBOdW0gPSBpICsgMTtcclxuICAgICAgICAgICAgY29uc3QgcmV3YXJkSXRlbSA9IGxldmVscy5maW5kKGwgPT4gTnVtYmVyKGwuc3RhbXBfbnVtYmVyKSA9PT0gc3RhbXBOdW0pIHx8IGxldmVsc1tpXTtcclxuICAgICAgICAgICAgY29uc3QgcmF3VHlwZSA9IFN0cmluZyhyZXdhcmRJdGVtPy5yZXdhcmRfdHlwZSA/PyByZXdhcmRJdGVtPy50eXBlID8/ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgY29uc3QgaXNEaXNjb3VudCA9IHJhd1R5cGUgPT09ICcyJyB8fCByYXdUeXBlID09PSAnZGlzY291bnQnO1xyXG4gICAgICAgICAgICBjb25zdCBpc1BhaWQgPSByYXdUeXBlID09PSAnMycgfHwgcmF3VHlwZSA9PT0gJ3BhaWQnO1xyXG4gICAgICAgICAgICBjb25zdCBpc0ZyZWUgPSByYXdUeXBlID09PSAnMScgfHwgcmF3VHlwZSA9PT0gJ2ZyZWUnO1xyXG5cclxuICAgICAgICAgICAgbGV0IGluc2lkZUNvbnRlbnQgPSAnJztcclxuICAgICAgICAgICAgaWYgKHJld2FyZEl0ZW0gJiYgaXNEaXNjb3VudCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGlzYyA9IE51bWJlcihyZXdhcmRJdGVtLmRpc2NvdW50ID8/IHJld2FyZEl0ZW0uZGlzY291bnRWYWwgPz8gKHBhcnNlSW50KHJld2FyZEl0ZW0ucmV3YXJkX3RleHQpIHx8IDEwKSk7XHJcbiAgICAgICAgICAgICAgICBpbnNpZGVDb250ZW50ID0gYFxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZXh0IHg9XCIke3ggKyBzdGFtcFcgLyAyfVwiIHk9XCIke3kgKyBzdGFtcEggLyAyICsgN31cIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseT1cInN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgJ1NlZ29lIFVJJywgUm9ib3RvLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmXCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplPVwiMjBcIiBmb250LXdlaWdodD1cIjkwMFwiIGZpbGw9XCIke3N0YW1wVGV4dENvbG9yfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJjZW50cmFsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR7ZGlzY30lXHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXdhcmRJdGVtICYmIGlzUGFpZCkge1xyXG4gICAgICAgICAgICAgICAgaW5zaWRlQ29udGVudCA9IGBcclxuICAgICAgICAgICAgICAgICAgICA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoJHt4ICsgKHN0YW1wVyAtIDI4KSAvIDJ9LCAke3kgKyAoc3RhbXBIIC0gMjgpIC8gMn0pIHNjYWxlKDAuMDU0KVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiJHtTVkdfSUNPTlMudGFnfVwiIGZpbGw9XCIke3N0YW1wVGV4dENvbG9yfVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9nPlxyXG4gICAgICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXdhcmRJdGVtICYmIGlzRnJlZSkge1xyXG4gICAgICAgICAgICAgICAgaW5zaWRlQ29udGVudCA9IGBcclxuICAgICAgICAgICAgICAgICAgICA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoJHt4ICsgKHN0YW1wVyAtIDI4KSAvIDJ9LCAke3kgKyAoc3RhbXBIIC0gMjgpIC8gMn0pIHNjYWxlKDAuMDU0KVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiJHtTVkdfSUNPTlMuZ2lmdH1cIiBmaWxsPVwiJHtzdGFtcFRleHRDb2xvcn1cIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZz5cclxuICAgICAgICAgICAgICAgIGA7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpbnNpZGVDb250ZW50ID0gYFxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZXh0IHg9XCIke3ggKyBzdGFtcFcgLyAyfVwiIHk9XCIke3kgKyBzdGFtcEggLyAyICsgN31cIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmb250LWZhbWlseT1cInN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgJ1NlZ29lIFVJJywgUm9ib3RvLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmXCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udC1zaXplPVwiMjZcIiBmb250LXdlaWdodD1cIjgwMFwiIGZpbGw9XCIke3N0YW1wVGV4dENvbG9yfVwiIHRleHQtYW5jaG9yPVwibWlkZGxlXCIgZG9taW5hbnQtYmFzZWxpbmU9XCJjZW50cmFsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR7c3RhbXBOdW19XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3RhbXBHcmlkU3ZnICs9IGBcclxuICAgICAgICAgICAgICAgIDxnPlxyXG4gICAgICAgICAgICAgICAgICAgIDxyZWN0IHg9XCIke3h9XCIgeT1cIiR7eX1cIiB3aWR0aD1cIiR7c3RhbXBXfVwiIGhlaWdodD1cIiR7c3RhbXBIfVwiIHJ4PVwiJHtzdGFtcEJvcmRlclJhZGl1c31cIiByeT1cIiR7c3RhbXBCb3JkZXJSYWRpdXN9XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxsPVwiJHtzdGFtcEJnQ29sb3J9XCIgc3Ryb2tlPVwiJHtzdGFtcEJvcmRlckNvbG9yfVwiIHN0cm9rZS13aWR0aD1cIjRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgICR7aW5zaWRlQ29udGVudH1cclxuICAgICAgICAgICAgICAgIDwvZz5cclxuICAgICAgICAgICAgYDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gNC4gQXNzZW1ibGUgdGhlIEZ1bGwgMToxIFNWRyBMYXlvdXRcclxuICAgIGNvbnN0IHN2Z1N0cmluZyA9IGBcclxuICAgIDxzdmcgd2lkdGg9XCIke3dpZHRofVwiIGhlaWdodD1cIiR7aGVpZ2h0fVwiIHZpZXdCb3g9XCIwIDAgJHt3aWR0aH0gJHtoZWlnaHR9XCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiPlxyXG4gICAgICAgIDxkZWZzPlxyXG4gICAgICAgICAgICA8Y2xpcFBhdGggaWQ9XCJjYXJkQ2xpcFwiPlxyXG4gICAgICAgICAgICAgICAgPHJlY3QgeD1cIjBcIiB5PVwiMFwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIiByeD1cIjQ0XCIgcnk9XCI0NFwiIC8+XHJcbiAgICAgICAgICAgIDwvY2xpcFBhdGg+XHJcbiAgICAgICAgPC9kZWZzPlxyXG5cclxuICAgICAgICA8IS0tIFJvdW5kZWQgQ2FyZCBDb250YWluZXIgLS0+XHJcbiAgICAgICAgPGcgY2xpcC1wYXRoPVwidXJsKCNjYXJkQ2xpcClcIj5cclxuICAgICAgICAgICAgPCEtLSBDYXJkIEJhY2tncm91bmQ6IElmIEJhY2tncm91bmQgSW1hZ2UgaXMgcHJvdmlkZWQsIGRpc3BsYXkgaXQgd2l0aCBjb3ZlcjsgT3RoZXJ3aXNlLCB1c2UgYmFja2dyb3VuZCBjb2xvciAtLT5cclxuICAgICAgICAgICAgJHtiZ0ltYWdlQmFzZTY0ID8gYFxyXG4gICAgICAgICAgICAgICAgPGltYWdlIGhyZWY9XCIke2JnSW1hZ2VCYXNlNjR9XCIgeD1cIjBcIiB5PVwiMFwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPVwieE1pZFlNaWQgc2xpY2VcIiAvPlxyXG4gICAgICAgICAgICBgIDogYFxyXG4gICAgICAgICAgICAgICAgPHJlY3QgeD1cIjBcIiB5PVwiMFwiIHdpZHRoPVwiJHt3aWR0aH1cIiBoZWlnaHQ9XCIke2hlaWdodH1cIiBmaWxsPVwiJHtiZ0NvbG9yfVwiIC8+XHJcbiAgICAgICAgICAgIGB9XHJcblxyXG4gICAgICAgICAgICA8IS0tIDRweCBCb3JkZXIgT3ZlcmxheSAoMnB4IGF0IDF4KSAtLT5cclxuICAgICAgICAgICAgPHJlY3QgeD1cIjJcIiB5PVwiMlwiIHdpZHRoPVwiJHt3aWR0aCAtIDR9XCIgaGVpZ2h0PVwiJHtoZWlnaHQgLSA0fVwiIHJ4PVwiNDRcIiByeT1cIjQ0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCIke2JvcmRlckNvbG9yfVwiIHN0cm9rZS13aWR0aD1cIjRcIiAvPlxyXG5cclxuICAgICAgICAgICAgPCEtLSBMRUZUIENPTFVNTiAocGFkZGluZyA0NHB4KSAtLT5cclxuICAgICAgICAgICAgPGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDQ0LCA0NClcIj5cclxuICAgICAgICAgICAgICAgIDwhLS0gQlJBTkQgTE9HTyAmIEJSQU5EIE5BTUUgLS0+XHJcbiAgICAgICAgICAgICAgICA8Zz5cclxuICAgICAgICAgICAgICAgICAgICA8IS0tIFdoaXRlIFJvdW5kZWQgQm94IDU2eDU2ICgyOHgyOCBhdCAxeCwgYm9yZGVyUmFkaXVzIDE2cHgpIC0tPlxyXG4gICAgICAgICAgICAgICAgICAgIDxyZWN0IHg9XCIwXCIgeT1cIjBcIiB3aWR0aD1cIjU2XCIgaGVpZ2h0PVwiNTZcIiByeD1cIjE2XCIgcnk9XCIxNlwiIGZpbGw9XCIjRkZGRkZGXCIgLz5cclxuICAgICAgICAgICAgICAgICAgICAke2JyYW5kTG9nb0Jhc2U2NCA/IGBcclxuICAgICAgICAgICAgICAgICAgICAgICAgPGltYWdlIGhyZWY9XCIke2JyYW5kTG9nb0Jhc2U2NH1cIiB4PVwiNFwiIHk9XCI0XCIgd2lkdGg9XCI0OFwiIGhlaWdodD1cIjQ4XCIgcHJlc2VydmVBc3BlY3RSYXRpbz1cInhNaWRZTWlkIG1lZXRcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIGAgOiAoZmxMb2dvQmFzZTY0ID8gYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8aW1hZ2UgaHJlZj1cIiR7ZmxMb2dvQmFzZTY0fVwiIHg9XCI0XCIgeT1cIjRcIiB3aWR0aD1cIjQ4XCIgaGVpZ2h0PVwiNDhcIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPVwieE1pZFlNaWQgbWVldFwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgYCA6IGBcclxuICAgICAgICAgICAgICAgICAgICAgICAgPHRleHQgeD1cIjI4XCIgeT1cIjMyXCIgZm9udC1mYW1pbHk9XCJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIHNhbnMtc2VyaWZcIiBmb250LXNpemU9XCIyNFwiIGZvbnQtd2VpZ2h0PVwiOTAwXCIgZmlsbD1cIiMwRTg4QjhcIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGRvbWluYW50LWJhc2VsaW5lPVwiY2VudHJhbFwiPkZQPC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgICAgIGApfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICA8IS0tIEJyYW5kIE5hbWUgLS0+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRleHQgeD1cIjcyXCIgeT1cIjM4XCIgZm9udC1mYW1pbHk9XCJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZlwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjMyXCIgZm9udC13ZWlnaHQ9XCI4MDBcIiBmaWxsPVwiJHt0ZXh0Q29sb3J9XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR7YnJhbmROYW1lfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGV4dD5cclxuICAgICAgICAgICAgICAgIDwvZz5cclxuXHJcbiAgICAgICAgICAgICAgICA8IS0tIENBUkQgVElUTEUgLS0+XHJcbiAgICAgICAgICAgICAgICA8dGV4dCB4PVwiMFwiIHk9XCI5NFwiIGZvbnQtZmFtaWx5PVwic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCAnU2Vnb2UgVUknLCBSb2JvdG8sIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWZcIiBcclxuICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjI0XCIgZm9udC13ZWlnaHQ9XCI3MDBcIiBmaWxsPVwiJHt0ZXh0Q29sb3J9XCIgb3BhY2l0eT1cIjAuOTVcIj5cclxuICAgICAgICAgICAgICAgICAgICAke2NhcmRUaXRsZX1cclxuICAgICAgICAgICAgICAgIDwvdGV4dD5cclxuXHJcbiAgICAgICAgICAgICAgICA8IS0tIENBUkRIT0xERVIgTkFNRSB3aXRoIFVzZXIgVmVjdG9yIEljb24gLS0+XHJcbiAgICAgICAgICAgICAgICA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoMCwgMTE0KVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT1cInNjYWxlKDAuMDQ2KVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPVwiJHtTVkdfSUNPTlMudXNlcn1cIiBmaWxsPVwiJHt0ZXh0Q29sb3J9XCIgb3BhY2l0eT1cIjAuOVwiIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9nPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZXh0IHg9XCIzMFwiIHk9XCIyMVwiIGZvbnQtZmFtaWx5PVwic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCAnU2Vnb2UgVUknLCBSb2JvdG8sIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWZcIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU9XCIyOFwiIGZvbnQtd2VpZ2h0PVwiNzAwXCIgZmlsbD1cIiR7dGV4dENvbG9yfVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAke2N1c3RvbWVyTmFtZX1cclxuICAgICAgICAgICAgICAgICAgICA8L3RleHQ+XHJcbiAgICAgICAgICAgICAgICA8L2c+XHJcbiAgICAgICAgICAgIDwvZz5cclxuXHJcbiAgICAgICAgICAgIDwhLS0gVFlQRSAxOiBTVEFNUCBHUklEIC0tPlxyXG4gICAgICAgICAgICAke3R5cGUgPT09IDEgPyBzdGFtcEdyaWRTdmcgOiBgXHJcbiAgICAgICAgICAgICAgICA8IS0tIFRZUEUgMjogVkFMSUQgVEhSVSAtLT5cclxuICAgICAgICAgICAgICAgIDxnIHRyYW5zZm9ybT1cInRyYW5zbGF0ZSg0NCwgMjUwKVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaW5lIHgxPVwiMFwiIHkxPVwiMFwiIHgyPVwiNDAwXCIgeTI9XCIwXCIgc3Ryb2tlPVwicmdiYSgyNTUsMjU1LDI1NSwwLjI1KVwiIHN0cm9rZS13aWR0aD1cIjJcIiAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZXh0IHg9XCIwXCIgeT1cIjMwXCIgZm9udC1mYW1pbHk9XCJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIHNhbnMtc2VyaWZcIiBmb250LXNpemU9XCIxOFwiIGZvbnQtd2VpZ2h0PVwiNjAwXCIgZmlsbD1cIiR7dGV4dENvbG9yfVwiIG9wYWNpdHk9XCIwLjg1XCIgbGV0dGVyLXNwYWNpbmc9XCIxXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFZBTElEIFRIUlVcclxuICAgICAgICAgICAgICAgICAgICA8L3RleHQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRleHQgeD1cIjBcIiB5PVwiNzRcIiBmb250LWZhbWlseT1cInN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgc2Fucy1zZXJpZlwiIGZvbnQtc2l6ZT1cIjMyXCIgZm9udC13ZWlnaHQ9XCI4MDBcIiBmaWxsPVwiJHt0ZXh0Q29sb3J9XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICR7dmFsaWRpdHl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZXh0PlxyXG4gICAgICAgICAgICAgICAgPC9nPlxyXG4gICAgICAgICAgICBgfVxyXG5cclxuICAgICAgICAgICAgPCEtLSBSSUdIVCBDT0xVTU46IFFSIENPREUgQ09OVEFJTkVSICgxOTJweCB3aWR0aCwgMTg0eDE4NCBRUiBDYW52YXMpIC0tPlxyXG4gICAgICAgICAgICA8ZyB0cmFuc2Zvcm09XCJ0cmFuc2xhdGUoNjA0LCA0OClcIj5cclxuICAgICAgICAgICAgICAgIDxyZWN0IHg9XCIwXCIgeT1cIjBcIiB3aWR0aD1cIjE5MlwiIGhlaWdodD1cIjE5MlwiIHJ4PVwiMTZcIiByeT1cIjE2XCIgZmlsbD1cIiNGRkZGRkZcIiAvPlxyXG4gICAgICAgICAgICAgICAgPGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKDQsIDQpIHNjYWxlKDQuNClcIj5cclxuICAgICAgICAgICAgICAgICAgICAke3FyU3ZnfVxyXG4gICAgICAgICAgICAgICAgPC9nPlxyXG5cclxuICAgICAgICAgICAgICAgIDwhLS0gU0NBTiBMQUJFTCAtLT5cclxuICAgICAgICAgICAgICAgIDx0ZXh0IHg9XCI5NlwiIHk9XCIyMjhcIiBmb250LWZhbWlseT1cInN5c3RlbS11aSwgLWFwcGxlLXN5c3RlbSwgJ1NlZ29lIFVJJywgUm9ib3RvLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmXCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICBmb250LXNpemU9XCIxOVwiIGZvbnQtd2VpZ2h0PVwiNzAwXCIgZmlsbD1cIiR7dGV4dENvbG9yfVwiIG9wYWNpdHk9XCIwLjlcIiB0ZXh0LWFuY2hvcj1cIm1pZGRsZVwiIGxldHRlci1zcGFjaW5nPVwiMVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICR7c2NhblRleHR9XHJcbiAgICAgICAgICAgICAgICA8L3RleHQ+XHJcbiAgICAgICAgICAgIDwvZz5cclxuXHJcbiAgICAgICAgICAgIDwhLS0gRk9PVEVSOiBQT1dFUkVEIEJZIEZJUlNUTE9PUC5DTy5JTiAtLT5cclxuICAgICAgICAgICAgPGcgdHJhbnNmb3JtPVwidHJhbnNsYXRlKCR7d2lkdGggLSA0NH0sICR7aGVpZ2h0IC0gMjR9KVwiPlxyXG4gICAgICAgICAgICAgICAgPHRleHQgeD1cIjBcIiB5PVwiMFwiIGZvbnQtZmFtaWx5PVwic3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCAnU2Vnb2UgVUknLCBSb2JvdG8sIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWZcIiBcclxuICAgICAgICAgICAgICAgICAgICAgIGZvbnQtc2l6ZT1cIjE5XCIgZm9udC13ZWlnaHQ9XCI2MDBcIiBmaWxsPVwiJHt0ZXh0Q29sb3J9XCIgb3BhY2l0eT1cIjAuOVwiIHRleHQtYW5jaG9yPVwiZW5kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgcG93ZXJlZCBieSAke2ZsTG9nb0Jhc2U2NCA/ICcgJyA6ICcnfTx0c3BhbiBmb250LXdlaWdodD1cIjgwMFwiPmZpcnN0bG9vcC5jby5pbjwvdHNwYW4+XHJcbiAgICAgICAgICAgICAgICA8L3RleHQ+XHJcbiAgICAgICAgICAgIDwvZz5cclxuICAgICAgICA8L2c+XHJcbiAgICA8L3N2Zz5cclxuICAgIGA7XHJcblxyXG4gICAgLy8gQ29udmVydCBTVkcgdG8gY3Jpc3AgUE5HIGJ1ZmZlciB2aWEgU2hhcnBcclxuICAgIHJldHVybiBhd2FpdCBzaGFycChCdWZmZXIuZnJvbShzdmdTdHJpbmcpKVxyXG4gICAgICAgIC5wbmcoeyBxdWFsaXR5OiAxMDAgfSlcclxuICAgICAgICAudG9CdWZmZXIoKTtcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblxcXFxhcGlcXFxcY2FyZC1pbWFnZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovbm9kZV9qcy9kZWFsb3JhL2FkbWluL2FwaS9jYXJkLWltYWdlLmpzXCI7aW1wb3J0IHsgZmV0Y2hDYXJkRGF0YSB9IGZyb20gJy4vdXRpbHMvZmV0Y2hDYXJkRGF0YS5qcyc7XHJcbmltcG9ydCB7IGdlbmVyYXRlQ2FyZFBuZ0J1ZmZlciB9IGZyb20gJy4vdXRpbHMvY2FyZFN2Z0dlbmVyYXRvci5qcyc7XHJcblxyXG4vKipcclxuICogU2VydmVybGVzcyAvIE5vZGUuanMgaGFuZGxlciBmb3IgR0VUIC9hcGkvY2FyZC1pbWFnZS86aWRcclxuICogR2VuZXJhdGVzIGFuZCByZXR1cm5zIGJpbmFyeSBQTkcgaW1hZ2UgZm9yIFdoYXRzQXBwIG9nOmltYWdlXHJcbiAqL1xyXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIEV4dHJhY3QgcGFyYW1ldGVycyBmcm9tIHF1ZXJ5IG9yIFVSTCBwYXRoXHJcbiAgICAgICAgY29uc3QgdXJsT2JqID0gbmV3IFVSTChyZXEudXJsLCBgaHR0cDovLyR7cmVxLmhlYWRlcnM/Lmhvc3QgfHwgJ2xvY2FsaG9zdCd9YCk7XHJcbiAgICAgICAgY29uc3QgcGF0aFNlZ21lbnRzID0gdXJsT2JqLnBhdGhuYW1lLnNwbGl0KCcvJykuZmlsdGVyKEJvb2xlYW4pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIE1hdGNoIC9hcGkvY2FyZC1pbWFnZS86aWQgb3IgL2NhcmQtaW1hZ2UvOmlkXHJcbiAgICAgICAgbGV0IHBhdGhJZCA9IG51bGw7XHJcbiAgICAgICAgY29uc3QgY2FyZEltZ0lkeCA9IHBhdGhTZWdtZW50cy5maW5kSW5kZXgocyA9PiBzID09PSAnY2FyZC1pbWFnZScpO1xyXG4gICAgICAgIGlmIChjYXJkSW1nSWR4ICE9PSAtMSAmJiBwYXRoU2VnbWVudHNbY2FyZEltZ0lkeCArIDFdKSB7XHJcbiAgICAgICAgICAgIHBhdGhJZCA9IHBhdGhTZWdtZW50c1tjYXJkSW1nSWR4ICsgMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpZCA9IHJlcS5xdWVyeT8uaWQgfHwgcGF0aElkIHx8IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KCdpZCcpIHx8ICczNSc7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHJlcS5xdWVyeT8udHlwZSB8fCB1cmxPYmouc2VhcmNoUGFyYW1zLmdldCgndHlwZScpIHx8ICcxJztcclxuICAgICAgICBjb25zdCBjdXNfaWQgPSByZXEucXVlcnk/LmN1c19pZCB8fCByZXEucXVlcnk/LmN1c3RvbWVyX2lkIHx8IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KCdjdXNfaWQnKSB8fCAnMSc7XHJcblxyXG4gICAgICAgIC8vIEV4dHJhY3QgcXVlcnkgcGFyYW1zIGZvciBmYWxsYmFjay9jdXN0b20gZHluYW1pYyBwcmV2aWV3XHJcbiAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsT2JqLnNlYXJjaFBhcmFtcy5lbnRyaWVzKCkpO1xyXG5cclxuICAgICAgICAvLyAxLiBGZXRjaCBjYXJkIGRldGFpbHNcclxuICAgICAgICBjb25zdCBjYXJkID0gYXdhaXQgZmV0Y2hDYXJkRGF0YSh7IGlkLCB0eXBlLCBjdXNfaWQsIHF1ZXJ5IH0pO1xyXG5cclxuICAgICAgICAvLyAyLiBSZW5kZXIgY2FyZCB0byBoaWdoLXJlcyBQTkcgYmluYXJ5IGJ1ZmZlclxyXG4gICAgICAgIGNvbnN0IHBuZ0J1ZmZlciA9IGF3YWl0IGdlbmVyYXRlQ2FyZFBuZ0J1ZmZlcihjYXJkKTtcclxuXHJcbiAgICAgICAgLy8gMy4gUmVzcG9uZCB3aXRoIENvbnRlbnQtVHlwZTogaW1hZ2UvcG5nXHJcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtTGVuZ3RoJywgcG5nQnVmZmVyLmxlbmd0aCk7XHJcbiAgICAgICAgcmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICdwdWJsaWMsIG1heC1hZ2U9NjAsIHMtbWF4YWdlPTMwMCwgc3RhbGUtd2hpbGUtcmV2YWxpZGF0ZT02MDAnKTtcclxuICAgICAgICByZXMuc2V0SGVhZGVyKCdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nLCAnKicpO1xyXG5cclxuICAgICAgICBpZiAodHlwZW9mIHJlcy5zdGF0dXMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5zZW5kKHBuZ0J1ZmZlcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKHBuZ0J1ZmZlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2VuZXJhdGluZyBjYXJkIGltYWdlOicsIGVycik7XHJcbiAgICAgICAgaWYgKHR5cGVvZiByZXMuc3RhdHVzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHJldHVybiByZXMuc3RhdHVzKDUwMCkuanNvbih7IGVycm9yOiAnRmFpbGVkIHRvIGdlbmVyYXRlIGNhcmQgaW1hZ2UnLCBkZXRhaWxzOiBlcnIubWVzc2FnZSB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBjYXJkIGltYWdlJywgZGV0YWlsczogZXJyLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXG5vZGVfanNcXFxcZGVhbG9yYVxcXFxhZG1pblxcXFxhcGlcXFxcY2FyZC1wcmV2aWV3LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9ub2RlX2pzL2RlYWxvcmEvYWRtaW4vYXBpL2NhcmQtcHJldmlldy5qc1wiO2ltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBmZXRjaENhcmREYXRhIH0gZnJvbSAnLi91dGlscy9mZXRjaENhcmREYXRhLmpzJztcclxuXHJcbi8vIENyYXdsZXIgVXNlci1BZ2VudCByZWdleCBwYXR0ZXJuXHJcbmNvbnN0IEJPVF9VU0VSX0FHRU5UUyA9IC9ib3R8Y3Jhd2xlcnxzcGlkZXJ8Y3Jhd2xpbmd8d2hhdHNhcHB8ZmFjZWJvb2tleHRlcm5hbGhpdHxmYWNlYm90fHR3aXR0ZXJib3R8dGVsZWdyYW1ib3R8bGlua2VkaW5ib3R8c2xhY2tib3R8ZGlzY29yZGJvdHxhcHBsZWJvdHxiaW5nYm90fGdvb2dsZWJvdHx5YW5kZXgvaTtcclxuXHJcbi8qKlxyXG4gKiBTZXJ2ZXJsZXNzIC8gTm9kZS5qcyBoYW5kbGVyIGZvciBHRVQgL2NhcmQtcHJldmlldy86aWRcclxuICogSW5qZWN0cyBkeW5hbWljIE9wZW4gR3JhcGggJiBUd2l0dGVyIG1ldGEgdGFncyBmb3IgV2hhdHNBcHAgYW5kIG90aGVyIGNyYXdsZXJzLlxyXG4gKiBEZWxpdmVycyBmdWxsIFJlYWN0IGFwcGxpY2F0aW9uIHRvIGh1bWFuIHVzZXJzLlxyXG4gKi9cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHJlcS51cmwsIGBodHRwOi8vJHtyZXEuaGVhZGVycz8uaG9zdCB8fCAnbG9jYWxob3N0J31gKTtcclxuICAgICAgICBjb25zdCBwYXRoU2VnbWVudHMgPSB1cmxPYmoucGF0aG5hbWUuc3BsaXQoJy8nKS5maWx0ZXIoQm9vbGVhbik7XHJcblxyXG4gICAgICAgIC8vIE1hdGNoIC9jYXJkLXByZXZpZXcvOmlkXHJcbiAgICAgICAgbGV0IHBhdGhJZCA9IG51bGw7XHJcbiAgICAgICAgY29uc3QgY2FyZFByZXZpZXdJZHggPSBwYXRoU2VnbWVudHMuZmluZEluZGV4KHMgPT4gcyA9PT0gJ2NhcmQtcHJldmlldycpO1xyXG4gICAgICAgIGlmIChjYXJkUHJldmlld0lkeCAhPT0gLTEgJiYgcGF0aFNlZ21lbnRzW2NhcmRQcmV2aWV3SWR4ICsgMV0pIHtcclxuICAgICAgICAgICAgcGF0aElkID0gcGF0aFNlZ21lbnRzW2NhcmRQcmV2aWV3SWR4ICsgMV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpZCA9IHJlcS5xdWVyeT8uaWQgfHwgcGF0aElkIHx8IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KCdpZCcpIHx8ICczNSc7XHJcbiAgICAgICAgY29uc3QgdHlwZSA9IHJlcS5xdWVyeT8udHlwZSB8fCB1cmxPYmouc2VhcmNoUGFyYW1zLmdldCgndHlwZScpIHx8ICcxJztcclxuICAgICAgICBjb25zdCBjdXNfaWQgPSByZXEucXVlcnk/LmN1c19pZCB8fCByZXEucXVlcnk/LmN1c3RvbWVyX2lkIHx8IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KCdjdXNfaWQnKSB8fCAnMSc7XHJcblxyXG4gICAgICAgIGNvbnN0IHVzZXJBZ2VudCA9IHJlcS5oZWFkZXJzPy5bJ3VzZXItYWdlbnQnXSB8fCAnJztcclxuICAgICAgICBjb25zdCBpc0JvdCA9IEJPVF9VU0VSX0FHRU5UUy50ZXN0KHVzZXJBZ2VudCkgfHwgdXJsT2JqLnNlYXJjaFBhcmFtcy5nZXQoJ2JvdCcpID09PSAnMSc7XHJcblxyXG4gICAgICAgIC8vIFJlc29sdmUgY3VycmVudCBob3N0ICYgcHJvdG9jb2wgZHluYW1pY2FsbHkgKHplcm8gaGFyZGNvZGluZylcclxuICAgICAgICBjb25zdCBmb3J3YXJkZWRQcm90byA9IHJlcS5oZWFkZXJzPy5bJ3gtZm9yd2FyZGVkLXByb3RvJ10gfHwgJ2h0dHBzJztcclxuICAgICAgICBjb25zdCBob3N0ID0gcmVxLmhlYWRlcnM/LlsneC1mb3J3YXJkZWQtaG9zdCddIHx8IHJlcS5oZWFkZXJzPy5ob3N0IHx8ICdsb2NhbGhvc3Q6NTE3Myc7XHJcbiAgICAgICAgY29uc3QgcHJvdG8gPSBob3N0LmluY2x1ZGVzKCdsb2NhbGhvc3QnKSB8fCBob3N0LmluY2x1ZGVzKCcxMjcuMC4wLjEnKSA/ICdodHRwJyA6IGZvcndhcmRlZFByb3RvO1xyXG4gICAgICAgIGNvbnN0IGJhc2VVcmwgPSBgJHtwcm90b306Ly8ke2hvc3R9YDtcclxuXHJcbiAgICAgICAgLy8gRXh0cmFjdCBxdWVyeSBwYXJhbWV0ZXJzIGZvciBkeW5hbWljIGZhbGxiYWNrXHJcbiAgICAgICAgY29uc3QgcXVlcnkgPSBPYmplY3QuZnJvbUVudHJpZXModXJsT2JqLnNlYXJjaFBhcmFtcy5lbnRyaWVzKCkpO1xyXG5cclxuICAgICAgICAvLyAxLiBGZXRjaCBjYXJkIGRldGFpbHNcclxuICAgICAgICBjb25zdCBjYXJkID0gYXdhaXQgZmV0Y2hDYXJkRGF0YSh7IGlkLCB0eXBlLCBjdXNfaWQsIHF1ZXJ5IH0pO1xyXG5cclxuICAgICAgICBjb25zdCBicmFuZE5hbWUgPSBjYXJkLmJyYW5kTmFtZSB8fCAnRmlyc3RQYXNzJztcclxuICAgICAgICBjb25zdCBjYXJkVGl0bGUgPSBjYXJkLnRpdGxlIHx8IChOdW1iZXIodHlwZSkgPT09IDIgPyAnTWVtYmVyc2hpcCBQYXNzJyA6ICdTdGFtcCBDYXJkJyk7XHJcbiAgICAgICAgY29uc3Qgb2dUaXRsZSA9IGAke2JyYW5kTmFtZX0gLSAke2NhcmRUaXRsZX1gO1xyXG4gICAgICAgIGNvbnN0IHRvdGFsU3RhbXBzID0gTnVtYmVyKGNhcmQudG90YWxfc3RhbXBzIHx8IDgpO1xyXG4gICAgICAgIGNvbnN0IG9nRGVzY3JpcHRpb24gPSBOdW1iZXIodHlwZSkgPT09IDJcclxuICAgICAgICAgICAgPyAoY2FyZC5kZXNjcmlwdGlvbiB8fCBgVmlldyB5b3VyIGV4Y2x1c2l2ZSAke2JyYW5kTmFtZX0gTWVtYmVyc2hpcCBQYXNzLmApXHJcbiAgICAgICAgICAgIDogYENvbGxlY3QgJHt0b3RhbFN0YW1wc30gc3RhbXBzIHRvIGVhcm4gZXhjbHVzaXZlIHJld2FyZHMgYXQgJHticmFuZE5hbWV9IWA7XHJcblxyXG4gICAgICAgIGNvbnN0IG9nSW1hZ2VVcmwgPSBgJHtiYXNlVXJsfS9hcGkvY2FyZC1pbWFnZS8ke2lkfT90eXBlPSR7dHlwZX0mY3VzX2lkPSR7Y3VzX2lkfWA7XHJcbiAgICAgICAgY29uc3Qgb2dQYWdlVXJsID0gYCR7YmFzZVVybH0vY2FyZC1wcmV2aWV3LyR7aWR9P3R5cGU9JHt0eXBlfSZjdXNfaWQ9JHtjdXNfaWR9YDtcclxuXHJcbiAgICAgICAgLy8gMi4gSWYgcmVxdWVzdGVkIGJ5IGEgQ1JBV0xFUiAoV2hhdHNBcHAsIEZhY2Vib29rLCBldGMuKTogUmV0dXJuIFNTUiBIVE1MIHdpdGggT0cgdGFnc1xyXG4gICAgICAgIGlmIChpc0JvdCkge1xyXG4gICAgICAgICAgICBjb25zdCBodG1sID0gYDwhRE9DVFlQRSBodG1sPlxyXG48aHRtbCBsYW5nPVwiZW5cIj5cclxuPGhlYWQ+XHJcbiAgICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ2aWV3cG9ydFwiIGNvbnRlbnQ9XCJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MVwiPlxyXG4gICAgPHRpdGxlPiR7ZXNjYXBlSHRtbChvZ1RpdGxlKX08L3RpdGxlPlxyXG4gICAgPG1ldGEgbmFtZT1cImRlc2NyaXB0aW9uXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ0Rlc2NyaXB0aW9uKX1cIj5cclxuICAgIDxtZXRhIG5hbWU9XCJyb2JvdHNcIiBjb250ZW50PVwiaW5kZXgsIGZvbGxvd1wiPlxyXG5cclxuICAgIDwhLS0gT3BlbiBHcmFwaCAvIEZhY2Vib29rIC8gV2hhdHNBcHAgLS0+XHJcbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOnR5cGVcIiBjb250ZW50PVwid2Vic2l0ZVwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzpzaXRlX25hbWVcIiBjb250ZW50PVwiRmlyc3RQYXNzXCI+XHJcbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOnRpdGxlXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ1RpdGxlKX1cIj5cclxuICAgIDxtZXRhIHByb3BlcnR5PVwib2c6ZGVzY3JpcHRpb25cIiBjb250ZW50PVwiJHtlc2NhcGVIdG1sKG9nRGVzY3JpcHRpb24pfVwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzppbWFnZVwiIGNvbnRlbnQ9XCIke29nSW1hZ2VVcmx9XCI+XHJcbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOmltYWdlOnNlY3VyZV91cmxcIiBjb250ZW50PVwiJHtvZ0ltYWdlVXJsfVwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzppbWFnZTp0eXBlXCIgY29udGVudD1cImltYWdlL3BuZ1wiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzppbWFnZTp3aWR0aFwiIGNvbnRlbnQ9XCI4NDBcIj5cclxuICAgIDxtZXRhIHByb3BlcnR5PVwib2c6aW1hZ2U6aGVpZ2h0XCIgY29udGVudD1cIjQ4MFwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzppbWFnZTphbHRcIiBjb250ZW50PVwiJHtlc2NhcGVIdG1sKG9nVGl0bGUpfVwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzp1cmxcIiBjb250ZW50PVwiJHtvZ1BhZ2VVcmx9XCI+XHJcblxyXG4gICAgPCEtLSBUd2l0dGVyIENhcmRzIC0tPlxyXG4gICAgPG1ldGEgbmFtZT1cInR3aXR0ZXI6Y2FyZFwiIGNvbnRlbnQ9XCJzdW1tYXJ5X2xhcmdlX2ltYWdlXCI+XHJcbiAgICA8bWV0YSBuYW1lPVwidHdpdHRlcjpzaXRlXCIgY29udGVudD1cIkBGaXJzdFBhc3NcIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ0d2l0dGVyOnRpdGxlXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ1RpdGxlKX1cIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ0Rlc2NyaXB0aW9uKX1cIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ0d2l0dGVyOmltYWdlXCIgY29udGVudD1cIiR7b2dJbWFnZVVybH1cIj5cclxuPC9oZWFkPlxyXG48Ym9keT5cclxuICAgIDxwPlZpZXdpbmcgPGEgaHJlZj1cIiR7b2dQYWdlVXJsfVwiPiR7ZXNjYXBlSHRtbChvZ1RpdGxlKX08L2E+Li4uPC9wPlxyXG48L2JvZHk+XHJcbjwvaHRtbD5gO1xyXG5cclxuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ3RleHQvaHRtbDsgY2hhcnNldD11dGYtOCcpO1xyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDYWNoZS1Db250cm9sJywgJ3B1YmxpYywgbWF4LWFnZT02MCwgcy1tYXhhZ2U9MzAwJyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5zZW5kKGh0bWwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChodG1sKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMy4gRm9yIEhVTUFOIFVTRVJTOiBTZXJ2ZSBpbmRleC5odG1sIChvciBidWlsdCBkaXN0L2luZGV4Lmh0bWwpXHJcbiAgICAgICAgbGV0IGluZGV4UGF0aCA9IHBhdGgucmVzb2x2ZShwcm9jZXNzLmN3ZCgpLCAnZGlzdCcsICdpbmRleC5odG1sJyk7XHJcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKGluZGV4UGF0aCkpIHtcclxuICAgICAgICAgICAgaW5kZXhQYXRoID0gcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdpbmRleC5odG1sJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZnMuZXhpc3RzU3luYyhpbmRleFBhdGgpKSB7XHJcbiAgICAgICAgICAgIGxldCBodG1sID0gZnMucmVhZEZpbGVTeW5jKGluZGV4UGF0aCwgJ3V0Zi04Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyBJbmplY3QgZHluYW1pYyBPcGVuIEdyYXBoIHRhZ3MgaW50byB0aGUgc3RhdGljIGluZGV4Lmh0bWwgaGVhZCBmb3IgaW5pdGlhbCBwYWdlIGxvYWRcclxuICAgICAgICAgICAgY29uc3QgaW5qZWN0ZWRNZXRhID0gYFxyXG4gICAgPCEtLSBEeW5hbWljIFNlcnZlci1JbmplY3RlZCBPcGVuIEdyYXBoIE1ldGEgLS0+XHJcbiAgICA8dGl0bGU+JHtlc2NhcGVIdG1sKG9nVGl0bGUpfTwvdGl0bGU+XHJcbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOnR5cGVcIiBjb250ZW50PVwid2Vic2l0ZVwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzp0aXRsZVwiIGNvbnRlbnQ9XCIke2VzY2FwZUh0bWwob2dUaXRsZSl9XCI+XHJcbiAgICA8bWV0YSBwcm9wZXJ0eT1cIm9nOmRlc2NyaXB0aW9uXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ0Rlc2NyaXB0aW9uKX1cIj5cclxuICAgIDxtZXRhIHByb3BlcnR5PVwib2c6aW1hZ2VcIiBjb250ZW50PVwiJHtvZ0ltYWdlVXJsfVwiPlxyXG4gICAgPG1ldGEgcHJvcGVydHk9XCJvZzp1cmxcIiBjb250ZW50PVwiJHtvZ1BhZ2VVcmx9XCI+XHJcbiAgICA8bWV0YSBuYW1lPVwidHdpdHRlcjpjYXJkXCIgY29udGVudD1cInN1bW1hcnlfbGFyZ2VfaW1hZ2VcIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ0d2l0dGVyOnRpdGxlXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ1RpdGxlKX1cIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ0d2l0dGVyOmRlc2NyaXB0aW9uXCIgY29udGVudD1cIiR7ZXNjYXBlSHRtbChvZ0Rlc2NyaXB0aW9uKX1cIj5cclxuICAgIDxtZXRhIG5hbWU9XCJ0d2l0dGVyOmltYWdlXCIgY29udGVudD1cIiR7b2dJbWFnZVVybH1cIj5cclxuYDtcclxuICAgICAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgnPC9oZWFkPicsIGAke2luamVjdGVkTWV0YX1cXG48L2hlYWQ+YCk7XHJcblxyXG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAndGV4dC9odG1sOyBjaGFyc2V0PXV0Zi04Jyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoMjAwKS5zZW5kKGh0bWwpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSAyMDA7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmVuZChodG1sKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRmFsbGJhY2sgcmVkaXJlY3QgaWYgaW5kZXguaHRtbCBpcyBub3QgZGlyZWN0bHkgYWNjZXNzaWJsZVxyXG4gICAgICAgIHJlcy5zZXRIZWFkZXIoJ0xvY2F0aW9uJywgYC9jYXJkLXByZXZpZXcvJHtpZH0/dHlwZT0ke3R5cGV9JmN1c19pZD0ke2N1c19pZH1gKTtcclxuICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDMwMjtcclxuICAgICAgICByZXR1cm4gcmVzLmVuZCgpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgY2FyZC1wcmV2aWV3IHJlcXVlc3Q6JywgZXJyKTtcclxuICAgICAgICBpZiAodHlwZW9mIHJlcy5zdGF0dXMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5zdGF0dXMoNTAwKS5zZW5kKCdJbnRlcm5hbCBTZXJ2ZXIgRXJyb3InKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoJ0ludGVybmFsIFNlcnZlciBFcnJvcicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZXNjYXBlSHRtbCh0ZXh0KSB7XHJcbiAgICBpZiAoIXRleHQpIHJldHVybiAnJztcclxuICAgIHJldHVybiBTdHJpbmcodGV4dClcclxuICAgICAgICAucmVwbGFjZSgvJi9nLCAnJmFtcDsnKVxyXG4gICAgICAgIC5yZXBsYWNlKC88L2csICcmbHQ7JylcclxuICAgICAgICAucmVwbGFjZSgvPi9nLCAnJmd0OycpXHJcbiAgICAgICAgLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKVxyXG4gICAgICAgIC5yZXBsYWNlKC8nL2csICcmIzAzOTsnKTtcclxufVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtRLFNBQVMsb0JBQW9CO0FBQy9SLE9BQU8sV0FBVztBQUNsQixPQUFPQSxXQUFVOzs7QUNGdVIsT0FBTyxXQUFXO0FBR25ULFNBQVMscUJBQXFCLE9BQU87QUFDeEMsTUFBSSxDQUFDLE1BQU8sUUFBTztBQUNuQixNQUFJLE1BQU0sT0FBTyxLQUFLLEVBQUUsS0FBSztBQUU3QixNQUFJLElBQUksV0FBVyxPQUFPLEtBQUssSUFBSSxXQUFXLE9BQU8sR0FBRztBQUNwRCxXQUFPO0FBQUEsRUFDWDtBQUVBLFFBQU0sZUFBZSxJQUFJLE1BQU0sZ0JBQWdCO0FBQy9DLE1BQUksY0FBYztBQUNkLFdBQU8sYUFBYSxDQUFDLEVBQUUsUUFBUSxRQUFRLEVBQUU7QUFBQSxFQUM3QztBQUVBLFNBQU8sSUFBSSxTQUFTLFNBQVMsS0FBSyxJQUFJLFNBQVMsVUFBVSxHQUFHO0FBQ3hELFVBQU0sV0FBVyxJQUFJLFlBQVksU0FBUztBQUMxQyxVQUFNLFlBQVksSUFBSSxZQUFZLFVBQVU7QUFDNUMsVUFBTSxNQUFNLEtBQUssSUFBSSxVQUFVLFNBQVM7QUFDeEMsUUFBSTtBQUNBLFlBQU0sTUFBTSxJQUFJLElBQUksSUFBSSxVQUFVLEdBQUcsQ0FBQztBQUN0QyxZQUFNLElBQUk7QUFBQSxJQUNkLFNBQVMsR0FBRztBQUNSLFlBQU0sSUFBSSxRQUFRLHNCQUFzQixFQUFFO0FBQUEsSUFDOUM7QUFBQSxFQUNKO0FBRUEsU0FBTyxJQUFJLFFBQVEsUUFBUSxFQUFFO0FBQ2pDO0FBR08sU0FBUyxlQUFlLEtBQUssU0FBUztBQUN6QyxNQUFJLENBQUMsSUFBSyxRQUFPO0FBQ2pCLE1BQUksTUFBTSxPQUFPLEdBQUcsRUFBRSxLQUFLO0FBRTNCLE1BQUksUUFBUSxVQUFVLFFBQVEsVUFBVSxRQUFRLGVBQWUsUUFBUSxTQUFTO0FBQzVFLFdBQU87QUFBQSxFQUNYO0FBRUEsTUFBSSxJQUFJLFdBQVcsU0FBUyxLQUFLLElBQUksV0FBVyxVQUFVLEtBQUssSUFBSSxXQUFXLE9BQU8sS0FBSyxJQUFJLFdBQVcsT0FBTyxHQUFHO0FBQy9HLFdBQU87QUFBQSxFQUNYO0FBRUEsUUFBTSxNQUFNLHFCQUFxQixHQUFHO0FBQ3BDLE1BQUksQ0FBQyxJQUFLLFFBQU87QUFFakIsUUFBTSxhQUFhLFdBQVcsSUFBSSxRQUFRLFFBQVEsRUFBRTtBQUNwRCxRQUFNLFdBQVcsSUFBSSxRQUFRLFFBQVEsRUFBRTtBQUN2QyxTQUFPLFlBQVksR0FBRyxTQUFTLElBQUksUUFBUSxLQUFLO0FBQ3BEO0FBTUEsZUFBc0IsY0FBYyxFQUFFLElBQUksT0FBTyxHQUFHLFNBQVMsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHO0FBQzFFLFFBQU0sU0FBUyxPQUFPLEVBQUUsS0FBSztBQUM3QixRQUFNLFdBQVcsT0FBTyxJQUFJLE1BQU0sSUFBSSxJQUFJO0FBQzFDLFFBQU0sYUFBYSxPQUFPLE1BQU0sS0FBSztBQUdyQyxRQUFNLFdBQ0YsUUFBUSxJQUFJLGdCQUNaLFFBQVEsSUFBSSxXQUNaLHFDQUNGLFFBQVEsUUFBUSxFQUFFO0FBRXBCLE1BQUk7QUFDQSxVQUFNLFVBQVU7QUFBQSxNQUNaLElBQUk7QUFBQSxNQUNKLE1BQU07QUFBQSxJQUNWO0FBQ0EsUUFBSSxZQUFZO0FBQ1osY0FBUSxTQUFTO0FBQUEsSUFDckI7QUFFQSxVQUFNLFdBQVcsTUFBTSxNQUFNLEtBQUssR0FBRyxPQUFPLGtDQUFrQyxTQUFTO0FBQUEsTUFDbkYsU0FBUztBQUFBLE1BQ1QsU0FBUztBQUFBLFFBQ0wsZ0JBQWdCO0FBQUEsUUFDaEIsd0JBQXdCO0FBQUEsTUFDNUI7QUFBQSxJQUNKLENBQUM7QUFFRCxRQUFJLFVBQVUsTUFBTSxXQUFXLEtBQUssVUFBVSxNQUFNLE1BQU07QUFDdEQsWUFBTSxNQUFNLFNBQVMsS0FBSztBQUMxQixZQUFNLE9BQU8sTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsSUFBSTtBQUUzQyxVQUFJLE1BQU07QUFDTixjQUFNQyxlQUFjLE9BQU8sS0FBSyxvQkFBb0IsS0FBSyxnQkFBZ0IsQ0FBQztBQUMxRSxjQUFNLHNCQUFzQixNQUFNLFFBQVEsS0FBSyxtQkFBbUIsSUFDNUQsS0FBSyxzQkFDTCxNQUFNLFFBQVEsS0FBSyxZQUFZLElBQzNCLEtBQUssZUFDTCxDQUFDO0FBRVgsY0FBTSxlQUFlLG9CQUFvQixTQUFTLElBQzVDLG9CQUFvQixJQUFJLENBQUMsS0FBSyxRQUFRO0FBQ3BDLGdCQUFNLFVBQVUsT0FBTyxJQUFJLGVBQWUsSUFBSSxRQUFRLEVBQUUsRUFBRSxLQUFLLEVBQUUsWUFBWTtBQUM3RSxnQkFBTSxhQUFhLFlBQVksT0FBTyxZQUFZO0FBQ2xELGdCQUFNLFNBQVMsWUFBWSxPQUFPLFlBQVk7QUFDOUMsZ0JBQU0sUUFBUSxhQUFhLGFBQWEsU0FBUyxTQUFTO0FBRTFELGlCQUFPO0FBQUEsWUFDSCxJQUFJLE9BQU8sSUFBSSxNQUFNLElBQUksa0JBQWtCLENBQUM7QUFBQSxZQUM1QyxjQUFjLE9BQU8sSUFBSSxnQkFBZ0IsSUFBSSxLQUFLLEtBQUssTUFBTTtBQUFBLFlBQzdELFFBQVEsT0FBTyxJQUFJLE1BQU0sS0FBSztBQUFBLFlBQzlCLFFBQVEsSUFBSSxnQkFBZ0IsYUFBYSxhQUFhLFNBQVMsU0FBUztBQUFBLFlBQ3hFLE1BQU07QUFBQSxZQUNOLGFBQWEsYUFBYSxXQUFXLElBQUksWUFBWSxJQUFJLGVBQWUsRUFBRSxJQUFJO0FBQUEsWUFDOUUsTUFBTSxJQUFJLFNBQVMsYUFBYSxlQUFlLFNBQVMsV0FBVztBQUFBLFlBQ25FLEtBQUssT0FBTyxJQUFJLEdBQUcsS0FBSztBQUFBLFVBQzVCO0FBQUEsUUFDSixDQUFDLElBQ0MsTUFBTSxLQUFLLEVBQUUsUUFBUUEsYUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsT0FBTztBQUFBLFVBQ2pELElBQUk7QUFBQSxVQUNKLGNBQWMsSUFBSTtBQUFBLFVBQ2xCLFFBQVEsSUFBSSxPQUFPLEtBQUssaUJBQWlCLEtBQUssYUFBYSxDQUFDLElBQUksSUFBSTtBQUFBLFVBQ3BFLFFBQVEsVUFBVSxJQUFJLENBQUM7QUFBQSxVQUN2QixNQUFNO0FBQUEsVUFDTixhQUFhO0FBQUEsVUFDYixNQUFNO0FBQUEsVUFDTixLQUFLO0FBQUEsUUFDVCxFQUFFO0FBRU4sY0FBTSxlQUFlLEtBQUssZUFBZSxLQUFLO0FBQzlDLGNBQU0sYUFBYSxLQUFLLG9CQUFvQixLQUFLLFlBQVksS0FBSztBQUVsRSxlQUFPO0FBQUEsVUFDSCxJQUFJO0FBQUEsVUFDSixXQUFXO0FBQUEsVUFDWCxPQUFPLEtBQUssVUFBVSxhQUFhLElBQUksd0JBQXdCO0FBQUEsVUFDL0QsV0FBVyxLQUFLLGNBQWM7QUFBQSxVQUM5QixXQUFXLGVBQWUsY0FBYyxPQUFPO0FBQUEsVUFDL0MsY0FBY0E7QUFBQSxVQUNkLGdCQUFnQixLQUFLLGlCQUFpQixLQUFLLFVBQVUsUUFBUTtBQUFBLFVBQzdELFNBQVMsS0FBSyxxQkFBcUIsYUFBYSxJQUFJLFlBQVk7QUFBQSxVQUNoRSxTQUFTLGVBQWUsWUFBWSxPQUFPO0FBQUEsVUFDM0MsV0FBVyxLQUFLLGNBQWM7QUFBQSxVQUM5QixhQUFhLEtBQUssaUJBQWlCLGFBQWEsSUFBSSxZQUFZO0FBQUEsVUFDaEUsY0FBYyxLQUFLLG9CQUFvQjtBQUFBLFVBQ3ZDLGtCQUFrQixLQUFLLHNCQUFzQjtBQUFBLFVBQzdDLGdCQUFnQixLQUFLLG9CQUFvQjtBQUFBLFVBQ3pDLGNBQWMsT0FBTyxLQUFLLGdCQUFnQixFQUFFO0FBQUEsVUFDNUMsVUFBVSxLQUFLLFlBQVksZ0JBQWdCLE1BQU0sSUFBSSxVQUFVO0FBQUEsVUFDL0Q7QUFBQSxVQUNBO0FBQUEsVUFDQSxVQUFVLEtBQUssWUFBWTtBQUFBLFVBQzNCLGFBQWEsS0FBSyxlQUFlO0FBQUEsUUFDckM7QUFBQSxNQUNKO0FBQUEsSUFDSjtBQUFBLEVBQ0osU0FBUyxLQUFLO0FBQ1YsWUFBUSxLQUFLLHFFQUFxRSxJQUFJLE9BQU87QUFBQSxFQUNqRztBQUdBLFFBQU0sY0FBYyxPQUFPLE1BQU0sVUFBVSxNQUFNLGdCQUFnQixDQUFDO0FBQ2xFLFFBQU0sY0FBYyxNQUFNLFlBQVksTUFBTSxlQUFlO0FBQzNELFFBQU0sZUFBZSxNQUFNLFdBQVcsTUFBTSxZQUFZLE1BQU0sb0JBQW9CO0FBQ2xGLFFBQU0sWUFBWSxNQUFNLFFBQVEsTUFBTSxjQUFjLE1BQU0sZUFBZTtBQUV6RSxTQUFPO0FBQUEsSUFDSCxJQUFJO0FBQUEsSUFDSixXQUFXO0FBQUEsSUFDWCxPQUFPLE1BQU0sVUFBVSxhQUFhLElBQUksb0JBQW9CO0FBQUEsSUFDNUQsV0FBVyxNQUFNLFNBQVMsTUFBTSxjQUFjO0FBQUEsSUFDOUMsV0FBVyxlQUFlLFdBQVcsT0FBTztBQUFBLElBQzVDLGNBQWM7QUFBQSxJQUNkLGdCQUFnQixNQUFNLFFBQVEsTUFBTSxpQkFBaUI7QUFBQSxJQUNyRCxTQUFTLE1BQU0sV0FBVyxNQUFNLGFBQWEsYUFBYSxJQUFJLFlBQVk7QUFBQSxJQUMxRSxTQUFTLGVBQWUsY0FBYyxPQUFPO0FBQUEsSUFDN0MsV0FBVyxNQUFNLGFBQWE7QUFBQSxJQUM5QixhQUFhLE1BQU0sZUFBZSxNQUFNLGdCQUFnQjtBQUFBLElBQ3hELGNBQWMsTUFBTSxnQkFBZ0I7QUFBQSxJQUNwQyxrQkFBa0IsTUFBTSxvQkFBb0I7QUFBQSxJQUM1QyxnQkFBZ0IsTUFBTSxrQkFBa0I7QUFBQSxJQUN4QyxjQUFjO0FBQUEsSUFDZCxVQUFVLE1BQU0sTUFBTSxnQkFBZ0IsTUFBTSxJQUFJLFVBQVU7QUFBQSxJQUMxRCxjQUFjLE1BQU0sS0FBSyxFQUFFLFFBQVEsWUFBWSxDQUFDLEVBQUUsSUFBSSxDQUFDLEdBQUcsT0FBTztBQUFBLE1BQzdELGNBQWMsSUFBSTtBQUFBLE1BQ2xCLFFBQVEsSUFBSSxNQUFNLGNBQWMsR0FBRyxXQUFXLGlCQUFpQjtBQUFBLE1BQy9ELE1BQU0sSUFBSSxNQUFNLGNBQWMsYUFBYTtBQUFBLE1BQzNDLGFBQWEsSUFBSSxNQUFNLGNBQWMsT0FBTyxXQUFXLElBQUk7QUFBQSxNQUMzRCxNQUFNO0FBQUEsTUFDTixRQUFRO0FBQUEsSUFDWixFQUFFO0FBQUEsSUFDRixVQUFVLE1BQU0sWUFBWTtBQUFBLElBQzVCLGFBQWEsTUFBTSxlQUFlO0FBQUEsRUFDdEM7QUFDSjs7O0FDL0w4UyxPQUFPLFFBQVE7QUFDN1QsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sV0FBVztBQUNsQixPQUFPLFlBQVk7QUFDbkIsT0FBT0MsWUFBVztBQUdsQixJQUFNLFlBQVk7QUFBQSxFQUNkLE1BQU07QUFBQSxFQUNOLE1BQU07QUFBQSxFQUNOLEtBQUs7QUFDVDtBQUdBLFNBQVMsVUFBVSxRQUFRO0FBQ3ZCLE1BQUksQ0FBQyxPQUFRLFFBQU87QUFDcEIsU0FBTyxPQUFPLE1BQU0sRUFDZixRQUFRLE1BQU0sT0FBTyxFQUNyQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE1BQU0sTUFBTSxFQUNwQixRQUFRLE1BQU0sUUFBUSxFQUN0QixRQUFRLE1BQU0sUUFBUTtBQUMvQjtBQUdBLGVBQWUsZUFBZSxVQUFVO0FBQ3BDLE1BQUksQ0FBQyxTQUFVLFFBQU87QUFDdEIsTUFBSSxTQUFTLFdBQVcsYUFBYSxFQUFHLFFBQU87QUFDL0MsTUFBSTtBQUNBLFVBQU0sV0FBVyxNQUFNQyxPQUFNLElBQUksVUFBVTtBQUFBLE1BQ3ZDLGNBQWM7QUFBQSxNQUNkLFNBQVM7QUFBQSxJQUNiLENBQUM7QUFFRCxVQUFNLFNBQVMsTUFBTSxNQUFNLE9BQU8sS0FBSyxTQUFTLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxTQUFTO0FBQ3RFLFdBQU8seUJBQXlCLE9BQU8sU0FBUyxRQUFRLENBQUM7QUFBQSxFQUM3RCxTQUFTLEdBQUc7QUFDUixZQUFRLEtBQUssc0RBQXNELFVBQVUsRUFBRSxPQUFPO0FBQ3RGLFdBQU87QUFBQSxFQUNYO0FBQ0o7QUFHQSxJQUFJLHFCQUFxQjtBQUN6QixTQUFTLHdCQUF3QjtBQUM3QixNQUFJLG1CQUFvQixRQUFPO0FBQy9CLE1BQUk7QUFDQSxVQUFNLFdBQVcsS0FBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLE9BQU8sVUFBVSxPQUFPLHVCQUF1QjtBQUM1RixRQUFJLEdBQUcsV0FBVyxRQUFRLEdBQUc7QUFDekIsWUFBTSxNQUFNLEdBQUcsYUFBYSxRQUFRO0FBQ3BDLDJCQUFxQix5QkFBeUIsSUFBSSxTQUFTLFFBQVEsQ0FBQztBQUNwRSxhQUFPO0FBQUEsSUFDWDtBQUFBLEVBQ0osU0FBUyxHQUFHO0FBQUEsRUFBQztBQUNiLFNBQU87QUFDWDtBQU1BLGVBQXNCLHNCQUFzQixNQUFNO0FBQzlDLFFBQU0sUUFBUTtBQUNkLFFBQU0sU0FBUztBQUNmLFFBQU0sT0FBTyxPQUFPLEtBQUssYUFBYSxDQUFDLE1BQU0sSUFBSSxJQUFJO0FBR3JELFFBQU0sWUFBWSxTQUFTLElBQUksWUFBWTtBQUMzQyxRQUFNLFVBQVUsS0FBSyxXQUFXO0FBQ2hDLFFBQU0sY0FBYyxLQUFLLGdCQUFnQixTQUFTLElBQUksWUFBWTtBQUNsRSxRQUFNLFlBQVksS0FBSyxhQUFhO0FBQ3BDLFFBQU0sY0FBYyxPQUFPLEtBQUssZ0JBQWdCLEtBQUssb0JBQW9CLENBQUM7QUFDMUUsUUFBTSxxQkFBcUIsT0FBTyxLQUFLLGdCQUFnQixFQUFFO0FBQ3pELFFBQU0sb0JBQXFCLHFCQUFxQixNQUFPO0FBRXZELFFBQU0sZUFBZSxLQUFLLGdCQUFnQjtBQUMxQyxRQUFNLG1CQUFtQixLQUFLLG9CQUFvQjtBQUNsRCxRQUFNLGlCQUFpQixLQUFLLGtCQUFrQjtBQUU5QyxRQUFNLFlBQVksVUFBVSxLQUFLLGFBQWEsVUFBVTtBQUN4RCxRQUFNLFlBQVksVUFBVSxLQUFLLFVBQVUsU0FBUyxJQUFJLG9CQUFvQixhQUFhO0FBQ3pGLFFBQU0sZUFBZSxVQUFVLEtBQUssa0JBQWtCLEtBQUssa0JBQWtCLFNBQVMsSUFBSSxnQkFBZ0IsYUFBYTtBQUN2SCxRQUFNLFdBQVcsVUFBVSxLQUFLLFlBQVksV0FBVztBQUN2RCxRQUFNLFdBQVcsU0FBUyxJQUFJLGNBQWM7QUFHNUMsUUFBTSxTQUFTLEtBQUssWUFBWSxLQUFLLFNBQVMsV0FBVyxLQUFLLE1BQU0sQ0FBQztBQUNyRSxNQUFJLFFBQVE7QUFDWixNQUFJO0FBQ0EsWUFBUSxNQUFNLE9BQU8sU0FBUyxRQUFRO0FBQUEsTUFDbEMsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLE1BQ1IsT0FBTztBQUFBLFFBQ0gsTUFBTTtBQUFBLFFBQ04sT0FBTztBQUFBLE1BQ1g7QUFBQSxJQUNKLENBQUM7QUFDRCxZQUFRLE1BQU0sUUFBUSxnQkFBZ0IsRUFBRSxFQUFFLFFBQVEsY0FBYyxFQUFFLEVBQUUsUUFBUSxXQUFXLEVBQUU7QUFBQSxFQUM3RixTQUFTLEtBQUs7QUFDVixZQUFRLEtBQUssNkJBQTZCLElBQUksT0FBTztBQUFBLEVBQ3pEO0FBR0EsTUFBSSxrQkFBa0I7QUFDdEIsTUFBSSxLQUFLLFdBQVc7QUFDaEIsc0JBQWtCLE1BQU0sZUFBZSxLQUFLLFNBQVM7QUFBQSxFQUN6RDtBQUVBLE1BQUksZ0JBQWdCO0FBQ3BCLE1BQUksS0FBSyxXQUFXLEtBQUssWUFBWSxVQUFVLEtBQUssWUFBWSxVQUFVLEtBQUssWUFBWSxhQUFhO0FBQ3BHLG9CQUFnQixNQUFNLGVBQWUsS0FBSyxPQUFPO0FBQUEsRUFDckQ7QUFFQSxRQUFNLGVBQWUsc0JBQXNCO0FBRzNDLE1BQUksZUFBZTtBQUNuQixNQUFJLFNBQVMsR0FBRztBQUNaLFVBQU0sU0FBUyxLQUFLLGdCQUFnQixLQUFLLHVCQUF1QixLQUFLLGdCQUFnQixDQUFDO0FBQ3RGLFVBQU0sU0FBUztBQUNmLFVBQU0sU0FBUztBQUNmLFVBQU0sT0FBTztBQUNiLFVBQU0sT0FBTztBQUNiLFVBQU0sVUFBVTtBQUNoQixVQUFNLFNBQVM7QUFDZixVQUFNLFNBQVM7QUFFZixhQUFTLElBQUksR0FBRyxJQUFJLGFBQWEsS0FBSztBQUNsQyxZQUFNLE1BQU0sSUFBSTtBQUNoQixZQUFNLE1BQU0sS0FBSyxNQUFNLElBQUksT0FBTztBQUNsQyxZQUFNLElBQUksU0FBUyxPQUFPLFNBQVM7QUFDbkMsWUFBTSxJQUFJLFNBQVMsT0FBTyxTQUFTO0FBRW5DLFlBQU0sV0FBVyxJQUFJO0FBQ3JCLFlBQU0sYUFBYSxPQUFPLEtBQUssT0FBSyxPQUFPLEVBQUUsWUFBWSxNQUFNLFFBQVEsS0FBSyxPQUFPLENBQUM7QUFDcEYsWUFBTSxVQUFVLE9BQU8sWUFBWSxlQUFlLFlBQVksUUFBUSxFQUFFLEVBQUUsS0FBSyxFQUFFLFlBQVk7QUFDN0YsWUFBTSxhQUFhLFlBQVksT0FBTyxZQUFZO0FBQ2xELFlBQU0sU0FBUyxZQUFZLE9BQU8sWUFBWTtBQUM5QyxZQUFNLFNBQVMsWUFBWSxPQUFPLFlBQVk7QUFFOUMsVUFBSSxnQkFBZ0I7QUFDcEIsVUFBSSxjQUFjLFlBQVk7QUFDMUIsY0FBTSxPQUFPLE9BQU8sV0FBVyxZQUFZLFdBQVcsZ0JBQWdCLFNBQVMsV0FBVyxXQUFXLEtBQUssR0FBRztBQUM3Ryx3QkFBZ0I7QUFBQSwrQkFDRCxJQUFJLFNBQVMsQ0FBQyxRQUFRLElBQUksU0FBUyxJQUFJLENBQUM7QUFBQTtBQUFBLG1FQUVKLGNBQWM7QUFBQSwwQkFDdkQsSUFBSTtBQUFBO0FBQUE7QUFBQSxNQUdsQixXQUFXLGNBQWMsUUFBUTtBQUM3Qix3QkFBZ0I7QUFBQSw4Q0FDYyxLQUFLLFNBQVMsTUFBTSxDQUFDLEtBQUssS0FBSyxTQUFTLE1BQU0sQ0FBQztBQUFBLG1DQUMxRCxVQUFVLEdBQUcsV0FBVyxjQUFjO0FBQUE7QUFBQTtBQUFBLE1BRzdELFdBQVcsY0FBYyxRQUFRO0FBQzdCLHdCQUFnQjtBQUFBLDhDQUNjLEtBQUssU0FBUyxNQUFNLENBQUMsS0FBSyxLQUFLLFNBQVMsTUFBTSxDQUFDO0FBQUEsbUNBQzFELFVBQVUsSUFBSSxXQUFXLGNBQWM7QUFBQTtBQUFBO0FBQUEsTUFHOUQsT0FBTztBQUNILHdCQUFnQjtBQUFBLCtCQUNELElBQUksU0FBUyxDQUFDLFFBQVEsSUFBSSxTQUFTLElBQUksQ0FBQztBQUFBO0FBQUEsbUVBRUosY0FBYztBQUFBLDBCQUN2RCxRQUFRO0FBQUE7QUFBQTtBQUFBLE1BR3RCO0FBRUEsc0JBQWdCO0FBQUE7QUFBQSwrQkFFRyxDQUFDLFFBQVEsQ0FBQyxZQUFZLE1BQU0sYUFBYSxNQUFNLFNBQVMsaUJBQWlCLFNBQVMsaUJBQWlCO0FBQUEsa0NBQ2hHLFlBQVksYUFBYSxnQkFBZ0I7QUFBQSxzQkFDckQsYUFBYTtBQUFBO0FBQUE7QUFBQSxJQUczQjtBQUFBLEVBQ0o7QUFHQSxRQUFNLFlBQVk7QUFBQSxrQkFDSixLQUFLLGFBQWEsTUFBTSxrQkFBa0IsS0FBSyxJQUFJLE1BQU07QUFBQTtBQUFBO0FBQUEsMkNBR2hDLEtBQUssYUFBYSxNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FPckQsZ0JBQWdCO0FBQUEsK0JBQ0MsYUFBYSx3QkFBd0IsS0FBSyxhQUFhLE1BQU07QUFBQSxnQkFDNUU7QUFBQSwyQ0FDMkIsS0FBSyxhQUFhLE1BQU0sV0FBVyxPQUFPO0FBQUEsYUFDeEU7QUFBQTtBQUFBO0FBQUEsdUNBRzBCLFFBQVEsQ0FBQyxhQUFhLFNBQVMsQ0FBQyx5Q0FBeUMsV0FBVztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0JBUXJHLGtCQUFrQjtBQUFBLHVDQUNELGVBQWU7QUFBQSx3QkFDN0IsZUFBZTtBQUFBLHVDQUNELFlBQVk7QUFBQSx3QkFDM0I7QUFBQTtBQUFBLHFCQUVGO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUVBSTZDLFNBQVM7QUFBQSwwQkFDbEQsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSwrREFNNEIsU0FBUztBQUFBLHNCQUNsRCxTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG1DQU1JLFVBQVUsSUFBSSxXQUFXLFNBQVM7QUFBQTtBQUFBO0FBQUEsbUVBR0YsU0FBUztBQUFBLDBCQUNsRCxZQUFZO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGNBTXhCLFNBQVMsSUFBSSxlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUEsbUlBSXlGLFNBQVM7QUFBQTtBQUFBO0FBQUEsbUlBR1QsU0FBUztBQUFBLDBCQUNsSCxRQUFRO0FBQUE7QUFBQTtBQUFBLGFBR3JCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQU1TLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLCtEQUtvQyxTQUFTO0FBQUEsc0JBQ2xELFFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNDQUtRLFFBQVEsRUFBRSxLQUFLLFNBQVMsRUFBRTtBQUFBO0FBQUEsK0RBRUQsU0FBUztBQUFBLGlDQUN2QyxlQUFlLE1BQU0sRUFBRTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFRcEQsU0FBTyxNQUFNLE1BQU0sT0FBTyxLQUFLLFNBQVMsQ0FBQyxFQUNwQyxJQUFJLEVBQUUsU0FBUyxJQUFJLENBQUMsRUFDcEIsU0FBUztBQUNsQjs7O0FDdFJBLGVBQU8sUUFBK0IsS0FBSyxLQUFLO0FBQzVDLE1BQUk7QUFFQSxVQUFNLFNBQVMsSUFBSSxJQUFJLElBQUksS0FBSyxVQUFVLElBQUksU0FBUyxRQUFRLFdBQVcsRUFBRTtBQUM1RSxVQUFNLGVBQWUsT0FBTyxTQUFTLE1BQU0sR0FBRyxFQUFFLE9BQU8sT0FBTztBQUc5RCxRQUFJLFNBQVM7QUFDYixVQUFNLGFBQWEsYUFBYSxVQUFVLE9BQUssTUFBTSxZQUFZO0FBQ2pFLFFBQUksZUFBZSxNQUFNLGFBQWEsYUFBYSxDQUFDLEdBQUc7QUFDbkQsZUFBUyxhQUFhLGFBQWEsQ0FBQztBQUFBLElBQ3hDO0FBRUEsVUFBTSxLQUFLLElBQUksT0FBTyxNQUFNLFVBQVUsT0FBTyxhQUFhLElBQUksSUFBSSxLQUFLO0FBQ3ZFLFVBQU0sT0FBTyxJQUFJLE9BQU8sUUFBUSxPQUFPLGFBQWEsSUFBSSxNQUFNLEtBQUs7QUFDbkUsVUFBTSxTQUFTLElBQUksT0FBTyxVQUFVLElBQUksT0FBTyxlQUFlLE9BQU8sYUFBYSxJQUFJLFFBQVEsS0FBSztBQUduRyxVQUFNLFFBQVEsT0FBTyxZQUFZLE9BQU8sYUFBYSxRQUFRLENBQUM7QUFHOUQsVUFBTSxPQUFPLE1BQU0sY0FBYyxFQUFFLElBQUksTUFBTSxRQUFRLE1BQU0sQ0FBQztBQUc1RCxVQUFNLFlBQVksTUFBTSxzQkFBc0IsSUFBSTtBQUdsRCxRQUFJLFVBQVUsZ0JBQWdCLFdBQVc7QUFDekMsUUFBSSxVQUFVLGtCQUFrQixVQUFVLE1BQU07QUFDaEQsUUFBSSxVQUFVLGlCQUFpQiw4REFBOEQ7QUFDN0YsUUFBSSxVQUFVLCtCQUErQixHQUFHO0FBRWhELFFBQUksT0FBTyxJQUFJLFdBQVcsWUFBWTtBQUNsQyxhQUFPLElBQUksT0FBTyxHQUFHLEVBQUUsS0FBSyxTQUFTO0FBQUEsSUFDekMsT0FBTztBQUNILFVBQUksYUFBYTtBQUNqQixhQUFPLElBQUksSUFBSSxTQUFTO0FBQUEsSUFDNUI7QUFBQSxFQUNKLFNBQVMsS0FBSztBQUNWLFlBQVEsTUFBTSxnQ0FBZ0MsR0FBRztBQUNqRCxRQUFJLE9BQU8sSUFBSSxXQUFXLFlBQVk7QUFDbEMsYUFBTyxJQUFJLE9BQU8sR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLGlDQUFpQyxTQUFTLElBQUksUUFBUSxDQUFDO0FBQUEsSUFDaEcsT0FBTztBQUNILFVBQUksYUFBYTtBQUNqQixVQUFJLFVBQVUsZ0JBQWdCLGtCQUFrQjtBQUNoRCxhQUFPLElBQUksSUFBSSxLQUFLLFVBQVUsRUFBRSxPQUFPLGlDQUFpQyxTQUFTLElBQUksUUFBUSxDQUFDLENBQUM7QUFBQSxJQUNuRztBQUFBLEVBQ0o7QUFDSjs7O0FDdkRrUixPQUFPQyxTQUFRO0FBQ2pTLE9BQU9DLFdBQVU7QUFJakIsSUFBTSxrQkFBa0I7QUFPeEIsZUFBT0MsU0FBK0IsS0FBSyxLQUFLO0FBQzVDLE1BQUk7QUFDQSxVQUFNLFNBQVMsSUFBSSxJQUFJLElBQUksS0FBSyxVQUFVLElBQUksU0FBUyxRQUFRLFdBQVcsRUFBRTtBQUM1RSxVQUFNLGVBQWUsT0FBTyxTQUFTLE1BQU0sR0FBRyxFQUFFLE9BQU8sT0FBTztBQUc5RCxRQUFJLFNBQVM7QUFDYixVQUFNLGlCQUFpQixhQUFhLFVBQVUsT0FBSyxNQUFNLGNBQWM7QUFDdkUsUUFBSSxtQkFBbUIsTUFBTSxhQUFhLGlCQUFpQixDQUFDLEdBQUc7QUFDM0QsZUFBUyxhQUFhLGlCQUFpQixDQUFDO0FBQUEsSUFDNUM7QUFFQSxVQUFNLEtBQUssSUFBSSxPQUFPLE1BQU0sVUFBVSxPQUFPLGFBQWEsSUFBSSxJQUFJLEtBQUs7QUFDdkUsVUFBTSxPQUFPLElBQUksT0FBTyxRQUFRLE9BQU8sYUFBYSxJQUFJLE1BQU0sS0FBSztBQUNuRSxVQUFNLFNBQVMsSUFBSSxPQUFPLFVBQVUsSUFBSSxPQUFPLGVBQWUsT0FBTyxhQUFhLElBQUksUUFBUSxLQUFLO0FBRW5HLFVBQU0sWUFBWSxJQUFJLFVBQVUsWUFBWSxLQUFLO0FBQ2pELFVBQU0sUUFBUSxnQkFBZ0IsS0FBSyxTQUFTLEtBQUssT0FBTyxhQUFhLElBQUksS0FBSyxNQUFNO0FBR3BGLFVBQU0saUJBQWlCLElBQUksVUFBVSxtQkFBbUIsS0FBSztBQUM3RCxVQUFNLE9BQU8sSUFBSSxVQUFVLGtCQUFrQixLQUFLLElBQUksU0FBUyxRQUFRO0FBQ3ZFLFVBQU0sUUFBUSxLQUFLLFNBQVMsV0FBVyxLQUFLLEtBQUssU0FBUyxXQUFXLElBQUksU0FBUztBQUNsRixVQUFNLFVBQVUsR0FBRyxLQUFLLE1BQU0sSUFBSTtBQUdsQyxVQUFNLFFBQVEsT0FBTyxZQUFZLE9BQU8sYUFBYSxRQUFRLENBQUM7QUFHOUQsVUFBTSxPQUFPLE1BQU0sY0FBYyxFQUFFLElBQUksTUFBTSxRQUFRLE1BQU0sQ0FBQztBQUU1RCxVQUFNLFlBQVksS0FBSyxhQUFhO0FBQ3BDLFVBQU0sWUFBWSxLQUFLLFVBQVUsT0FBTyxJQUFJLE1BQU0sSUFBSSxvQkFBb0I7QUFDMUUsVUFBTSxVQUFVLEdBQUcsU0FBUyxNQUFNLFNBQVM7QUFDM0MsVUFBTSxjQUFjLE9BQU8sS0FBSyxnQkFBZ0IsQ0FBQztBQUNqRCxVQUFNLGdCQUFnQixPQUFPLElBQUksTUFBTSxJQUNoQyxLQUFLLGVBQWUsdUJBQXVCLFNBQVMsc0JBQ3JELFdBQVcsV0FBVyx3Q0FBd0MsU0FBUztBQUU3RSxVQUFNLGFBQWEsR0FBRyxPQUFPLG1CQUFtQixFQUFFLFNBQVMsSUFBSSxXQUFXLE1BQU07QUFDaEYsVUFBTSxZQUFZLEdBQUcsT0FBTyxpQkFBaUIsRUFBRSxTQUFTLElBQUksV0FBVyxNQUFNO0FBRzdFLFFBQUksT0FBTztBQUNQLFlBQU0sT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFLWixXQUFXLE9BQU8sQ0FBQztBQUFBLHdDQUNRLFdBQVcsYUFBYSxDQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQU14QixXQUFXLE9BQU8sQ0FBQztBQUFBLCtDQUNiLFdBQVcsYUFBYSxDQUFDO0FBQUEseUNBQy9CLFVBQVU7QUFBQSxvREFDQyxVQUFVO0FBQUE7QUFBQTtBQUFBO0FBQUEsNkNBSWpCLFdBQVcsT0FBTyxDQUFDO0FBQUEsdUNBQ3pCLFNBQVM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDBDQUtOLFdBQVcsT0FBTyxDQUFDO0FBQUEsZ0RBQ2IsV0FBVyxhQUFhLENBQUM7QUFBQSwwQ0FDL0IsVUFBVTtBQUFBO0FBQUE7QUFBQSwwQkFHMUIsU0FBUyxLQUFLLFdBQVcsT0FBTyxDQUFDO0FBQUE7QUFBQTtBQUkvQyxVQUFJLFVBQVUsZ0JBQWdCLDBCQUEwQjtBQUN4RCxVQUFJLFVBQVUsaUJBQWlCLGtDQUFrQztBQUNqRSxVQUFJLE9BQU8sSUFBSSxXQUFXLFlBQVk7QUFDbEMsZUFBTyxJQUFJLE9BQU8sR0FBRyxFQUFFLEtBQUssSUFBSTtBQUFBLE1BQ3BDLE9BQU87QUFDSCxZQUFJLGFBQWE7QUFDakIsZUFBTyxJQUFJLElBQUksSUFBSTtBQUFBLE1BQ3ZCO0FBQUEsSUFDSjtBQUdBLFFBQUksWUFBWUMsTUFBSyxRQUFRLFFBQVEsSUFBSSxHQUFHLFFBQVEsWUFBWTtBQUNoRSxRQUFJLENBQUNDLElBQUcsV0FBVyxTQUFTLEdBQUc7QUFDM0Isa0JBQVlELE1BQUssUUFBUSxRQUFRLElBQUksR0FBRyxZQUFZO0FBQUEsSUFDeEQ7QUFFQSxRQUFJQyxJQUFHLFdBQVcsU0FBUyxHQUFHO0FBQzFCLFVBQUksT0FBT0EsSUFBRyxhQUFhLFdBQVcsT0FBTztBQUc3QyxZQUFNLGVBQWU7QUFBQTtBQUFBLGFBRXBCLFdBQVcsT0FBTyxDQUFDO0FBQUE7QUFBQSx5Q0FFUyxXQUFXLE9BQU8sQ0FBQztBQUFBLCtDQUNiLFdBQVcsYUFBYSxDQUFDO0FBQUEseUNBQy9CLFVBQVU7QUFBQSx1Q0FDWixTQUFTO0FBQUE7QUFBQSwwQ0FFTixXQUFXLE9BQU8sQ0FBQztBQUFBLGdEQUNiLFdBQVcsYUFBYSxDQUFDO0FBQUEsMENBQy9CLFVBQVU7QUFBQTtBQUV4QyxhQUFPLEtBQUssUUFBUSxXQUFXLEdBQUcsWUFBWTtBQUFBLFFBQVc7QUFFekQsVUFBSSxVQUFVLGdCQUFnQiwwQkFBMEI7QUFDeEQsVUFBSSxPQUFPLElBQUksV0FBVyxZQUFZO0FBQ2xDLGVBQU8sSUFBSSxPQUFPLEdBQUcsRUFBRSxLQUFLLElBQUk7QUFBQSxNQUNwQyxPQUFPO0FBQ0gsWUFBSSxhQUFhO0FBQ2pCLGVBQU8sSUFBSSxJQUFJLElBQUk7QUFBQSxNQUN2QjtBQUFBLElBQ0o7QUFHQSxRQUFJLFVBQVUsWUFBWSxpQkFBaUIsRUFBRSxTQUFTLElBQUksV0FBVyxNQUFNLEVBQUU7QUFDN0UsUUFBSSxhQUFhO0FBQ2pCLFdBQU8sSUFBSSxJQUFJO0FBQUEsRUFDbkIsU0FBUyxLQUFLO0FBQ1YsWUFBUSxNQUFNLHdDQUF3QyxHQUFHO0FBQ3pELFFBQUksT0FBTyxJQUFJLFdBQVcsWUFBWTtBQUNsQyxhQUFPLElBQUksT0FBTyxHQUFHLEVBQUUsS0FBSyx1QkFBdUI7QUFBQSxJQUN2RCxPQUFPO0FBQ0gsVUFBSSxhQUFhO0FBQ2pCLGFBQU8sSUFBSSxJQUFJLHVCQUF1QjtBQUFBLElBQzFDO0FBQUEsRUFDSjtBQUNKO0FBRUEsU0FBUyxXQUFXLE1BQU07QUFDdEIsTUFBSSxDQUFDLEtBQU0sUUFBTztBQUNsQixTQUFPLE9BQU8sSUFBSSxFQUNiLFFBQVEsTUFBTSxPQUFPLEVBQ3JCLFFBQVEsTUFBTSxNQUFNLEVBQ3BCLFFBQVEsTUFBTSxNQUFNLEVBQ3BCLFFBQVEsTUFBTSxRQUFRLEVBQ3RCLFFBQVEsTUFBTSxRQUFRO0FBQy9COzs7QUo3SkEsSUFBTSxtQ0FBbUM7QUFPekMsU0FBUyxlQUFlO0FBQ3RCLFNBQU87QUFBQSxJQUNMLE1BQU07QUFBQSxJQUNOLGdCQUFnQixRQUFRO0FBQ3RCLGFBQU8sWUFBWSxJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVM7QUFDL0MsY0FBTSxNQUFNLElBQUksT0FBTztBQUN2QixZQUFJLElBQUksV0FBVyxpQkFBaUIsS0FBTSxJQUFJLFdBQVcsYUFBYSxNQUFNLElBQUksUUFBUSxRQUFRLFNBQVMsT0FBTyxLQUFLLElBQUksSUFBSSxTQUFTLFFBQVEsSUFBSztBQUNqSixpQkFBTyxRQUFpQixLQUFLLEdBQUc7QUFBQSxRQUNsQztBQUNBLFlBQUksSUFBSSxXQUFXLG1CQUFtQixLQUFNLElBQUksV0FBVyxlQUFlLE1BQU0sSUFBSSxJQUFJLFNBQVMsT0FBTyxLQUFLLCtCQUErQixLQUFLLElBQUksUUFBUSxZQUFZLEtBQUssRUFBRSxJQUFLO0FBQ25MLGlCQUFPQyxTQUFtQixLQUFLLEdBQUc7QUFBQSxRQUNwQztBQUNBLGFBQUs7QUFBQSxNQUNQLENBQUM7QUFBQSxJQUNIO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUM7QUFBQSxFQUNqQyxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxXQUFXQyxNQUFLLFFBQVEsa0NBQVcsZ0JBQWdCO0FBQUEsTUFDbkQsS0FBS0EsTUFBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxNQUNaO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFFRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgInRvdGFsU3RhbXBzIiwgImF4aW9zIiwgImF4aW9zIiwgImZzIiwgInBhdGgiLCAiaGFuZGxlciIsICJwYXRoIiwgImZzIiwgImhhbmRsZXIiLCAicGF0aCJdCn0K
