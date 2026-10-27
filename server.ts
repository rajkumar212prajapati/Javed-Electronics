import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { shiprocketRouter } from './server/shiprocketApi';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount Shiprocket Shipping API Router
app.use('/api/shipping/shiprocket', shiprocketRouter);

// Initialize GoogleGenAI client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// System Instruction for Javed Electronics Customer Support Assistant
const SYSTEM_INSTRUCTION = `You are "Javed", the friendly, knowledgeable customer support AI for Javed Electronics - Lucknow's premier retail & digital electronics destination.
Key business information you know:
- Store Locations in Lucknow:
  1. Hazratganj Flagship Store: Shop 14-16, Janpath Market, Hazratganj, Lucknow (Open 10:00 AM - 9:30 PM)
  2. Gomti Nagar Tech Hub: Vibhuti Khand, near Riverside Mall, Gomti Nagar, Lucknow (Open 10:30 AM - 10:00 PM)
  3. Alambagh Express Outlet: Kanpur Road, near Metro Station, Alambagh, Lucknow (Open 10:00 AM - 9:00 PM)
  4. Chowk Heritage Branch: Medical College Road, Chowk, Old Lucknow (Open 10:00 AM - 9:00 PM)
- Delivery Services:
  - 4-Hour Express Doorstep Delivery in Lucknow for orders placed before 5:00 PM across serviceable pincodes (226001, 226010, 226005, 226020, 226028, etc.). Free delivery on orders over ₹799 or ₹999.
  - Store Counter Pickup: FREE, ready in 30 minutes at any of the 4 outlets.
- Payment Methods:
  - Cash on Delivery (COD) with verification.
  - Dynamic UPI Payment QR (PhonePe, Google Pay, Paytm, BHIM) with instant confirmation.
  - Razorpay Online Netbanking & Credit/Debit Cards.
- Tax & B2B GST Compliance:
  - 100% genuine products with GST Tax Invoices.
  - Registered businesses can claim Input Tax Credit (ITC) for GSTR-2B filing by providing their 15-digit GSTIN at checkout.
- Bulk Order Volume Discounts:
  - Multi-Item Tiered Savings: Buy 3+ items save 5%, Buy 6+ items save 10%, Buy 10+ items save 15%.
  - Corporate B2B Wholesale: 12% off on 10+ units (cap ₹35,000).
  - Power & Audio Multi-Pack: 15% off on 4+ chargers, cables, or earphones.
- Return & Warranty Policy:
  - 7 Days Local Store Replacement for verified defects.
  - 1 Year Official Brand Warranty on all electronics with authorized service support.
- Contact Helpline:
  - Phone: +91 98390 12345
  - WhatsApp: Instant click-to-chat support available.

Guidelines:
- Be polite, courteous, enthusiastic, and concise.
- Provide actionable answers. Mention relevant branches, delivery options, or bulk discounts when appropriate.
- If a customer asks about a specific order, ask for their Order ID (format: JE-2026-XXXXXX) to help track it.
- Keep responses within 2 to 4 concise paragraphs or bullet points for easy mobile reading.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required.' });
    }

    if (!aiClient) {
      // Fallback domain-specific answers
      return res.json({
        reply: getFallbackResponse(message),
        isFallback: true,
      });
    }

    // Format chat history for GoogleGenAI SDK
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      history.slice(-8).forEach((h: any) => {
        if ((h.role === 'user' || h.role === 'model') && typeof h.text === 'string') {
          contents.push({
            role: h.role,
            parts: [{ text: h.text }],
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply =
      response.text ||
      'Thank you for reaching out to Javed Electronics! How can I assist you with your electronics shopping or order today?';
    return res.json({ reply, isFallback: false });
  } catch (error: any) {
    console.error('Gemini API chat error:', error);
    const fallback = getFallbackResponse(req.body.message || '');
    return res.json({ reply: fallback, isFallback: true });
  }
});

// AI Assistant for Product Upload, Auto-Segregation, SEO & Margin Pricing
app.post('/api/ai/product-assistant', async (req, res) => {
  try {
    const {
      rawTitle = '',
      brand = '',
      category = '',
      mrp,
      purchaseCost,
      rawNotes = '',
      imageBase64 = '',
      imageMimeType = 'image/jpeg',
    } = req.body;

    const promptText = `You are the lead retail catalog AI specialist for Javed Electronics, Lucknow's premier digital electronics marketplace.
Analyze the following product data and optional packaging image:
- Raw Title / Input: "${rawTitle}"
- Provided Brand: "${brand}"
- Provided Category: "${category}"
- MRP (Maximum Retail Price in INR): ${mrp ? '₹' + mrp : 'Not provided'}
- Purchase Cost (Wholesale Cost in INR): ${purchaseCost ? '₹' + purchaseCost : 'Not provided'}
- Extra Notes / Supplier Invoice: "${rawNotes}"

Please auto-segregate all information and return a strictly valid JSON object with:
1. "name": Clean, professional commercial title (Format: "[Brand] [Model Name] [Key Variant/Spec]").
2. "brand": Canonical brand name (e.g. "boAt", "Xiaomi", "Samsung", "OnePlus", "Apple", "Realme", "Noise", "Sony", "JBL", "Anker").
3. "categoryId": One of ["smartphones", "audio", "chargers_cables", "smartwatches", "tvs_accessories", "computer_accessories", "home_electronics", "small_appliances"].
4. "description": Engaging, persuasive product description with key consumer benefits, Lucknow express delivery highlights, and 4-5 bulleted highlights.
5. "seoTitle": Search-optimized meta title under 60 characters with high buying intent (e.g., "Buy boAt Rockerz 450 Wireless Headphone Lucknow | Best Deal").
6. "seoDescription": Compelling meta description under 155 characters highlighting price, warranty, and 4-hour local Lucknow delivery.
7. "recommendedSalePrice": Mathematically optimized selling price in INR (integer):
   - If both MRP and Purchase Cost are provided: target 20% to 32% retail profit margin above purchase cost, while ensuring customer receives an attractive 15% to 50% discount from MRP. Sale price must be strictly >= purchaseCost and <= mrp.
   - If only MRP is provided: calculate 18% to 35% discount from MRP.
   - If only Purchase Cost is provided: apply 25% to 30% standard retail margin.
8. "grossMarginPercent": Calculated gross margin percentage: round(((recommendedSalePrice - purchaseCost) / recommendedSalePrice) * 100, 1).
9. "hsnCode": Appropriate 4-digit Indian GST HSN code (e.g., 8517 for smartphones, 8518 for audio/earbuds, 8504 for chargers/adapters, 8528 for displays/monitors, 8509 for appliances).
10. "gstRate": 18 (or appropriate GST percentage for the category).
11. "warrantyMonths": Standard manufacturer warranty in months (usually 12).
12. "specifications": An object containing 4 to 6 key technical specifications as key-value string pairs.
13. "pricingRationale": 1-2 sentence commercial explanation justifying the sale price for maximum marketplace conversion and profit.`;

    if (aiClient) {
      const parts: any[] = [];
      if (imageBase64 && typeof imageBase64 === 'string') {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: imageMimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: promptText });

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.text?.trim() || '';
      try {
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed, isFallback: false });
      } catch (e) {
        const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json({ success: true, data: parsed, isFallback: false });
      }
    }

    const fallback = generateProductFallback({
      rawTitle,
      brand,
      category,
      mrp: Number(mrp) || 0,
      purchaseCost: Number(purchaseCost) || 0,
      rawNotes,
    });
    return res.json({ success: true, data: fallback, isFallback: true });
  } catch (error: any) {
    console.error('Gemini Product Assistant error:', error);
    const fallback = generateProductFallback({
      rawTitle: req.body?.rawTitle || '',
      brand: req.body?.brand || '',
      category: req.body?.category || '',
      mrp: Number(req.body?.mrp) || 0,
      purchaseCost: Number(req.body?.purchaseCost) || 0,
      rawNotes: req.body?.rawNotes || '',
    });
    return res.json({ success: true, data: fallback, isFallback: true });
  }
});

// Fallback intelligent domain response generator
function getFallbackResponse(query: string): string {
  const q = query.toLowerCase();

  if (
    q.includes('bulk') ||
    q.includes('wholesale') ||
    q.includes('quantity') ||
    q.includes('volume') ||
    q.includes('discount') ||
    q.includes('slab')
  ) {
    return '🏷️ **Bulk Order Volume Discounts:**\nWe offer progressive volume savings automatically applied in your cart:\n\n• **Buy 3+ units:** 5% OFF\n• **Buy 6+ units:** 10% OFF\n• **Buy 10+ units:** 15% OFF\n• **Corporate B2B:** 12% wholesale pricing for registered businesses on 10+ units.\n\nBulk pricing slabs are displayed directly on each product page and automatically computed in your shopping cart!';
  }

  if (
    q.includes('track') ||
    q.includes('status') ||
    q.includes('where is') ||
    q.includes('my order') ||
    q.includes('order id') ||
    (q.includes('order') && !q.includes('branch') && !q.includes('pincode') && !q.includes('store'))
  ) {
    return '📦 **Order Tracking & Status:**\nYou can track any order by clicking **Track Order** in the top announcement bar or viewing **My Account > Order History**.\n\nOrders placed for Lucknow delivery are dispatched within **4 hours** via our local fleet. Need urgent help with a specific order? Provide your **Order ID (e.g. JE-2026-000104)** or connect with our dispatch coordinator on WhatsApp at **+91 98390 12345**.';
  }

  if (
    q.includes('branch') ||
    q.includes('store') ||
    q.includes('timing') ||
    q.includes('address') ||
    q.includes('location') ||
    q.includes('outlet') ||
    q.includes('hazratganj') ||
    q.includes('gomti nagar') ||
    q.includes('alambagh') ||
    q.includes('chowk')
  ) {
    return '🏪 **Javed Electronics Store Locations in Lucknow:**\n\n1. **Hazratganj Flagship:** Shop 14-16, Janpath Market (10:00 AM - 9:30 PM)\n2. **Gomti Nagar Tech Hub:** Vibhuti Khand, near Riverside Mall (10:30 AM - 10:00 PM)\n3. **Alambagh Express:** Kanpur Road, near Metro Station (10:00 AM - 9:00 PM)\n4. **Chowk Heritage Branch:** Medical College Road (10:00 AM - 9:00 PM)\n\nFree store pickup is ready within **30 minutes** of ordering!';
  }

  if (
    q.includes('delivery') ||
    q.includes('pincode') ||
    q.includes('shipping') ||
    q.includes('fast') ||
    q.includes('how long')
  ) {
    return '⚡ **Express Delivery Services:**\n\n• **4-Hour Same Day Dispatch:** Available across Lucknow pincodes (226001, 226010, 226005, 226020, 226028, etc.) for orders before 5:00 PM.\n• **Free Delivery:** Automatically unlocked on cart values over ₹799.\n• **Store Pickup:** 100% Free at all 4 Lucknow branches, ready in 30 minutes.';
  }

  if (
    q.includes('gst') ||
    q.includes('tax') ||
    q.includes('itc') ||
    q.includes('b2b') ||
    q.includes('invoice')
  ) {
    return "🧾 **GST & Input Tax Credit (ITC):**\n\n• All retail orders include an official GST tax invoice with HSN codes and CGST/SGST breakdown.\n• **B2B Buyers:** Check the **'Claim GST Input Tax Credit'** box at checkout, enter your 15-digit GSTIN and company name to receive a compliant B2B tax invoice for GSTR-2B input credit.";
  }

  if (
    q.includes('warranty') ||
    q.includes('return') ||
    q.includes('replace') ||
    q.includes('refund') ||
    q.includes('broken')
  ) {
    return '🛡️ **Warranty & Replacement Policy:**\n\n• **7-Day Local Replacement:** In case of any technical defect, visit any Lucknow branch or request doorstep pickup for an immediate replacement.\n• **1-Year Brand Warranty:** All smartphones, audio devices, and appliances come with authorized national manufacturer warranty cards.';
  }

  if (
    q.includes('phone') ||
    q.includes('mobile') ||
    q.includes('smartphone') ||
    q.includes('charger') ||
    q.includes('earphone') ||
    q.includes('tv')
  ) {
    return '📱 **Genuine Electronics & Best Deals:**\nWe stock the latest 5G smartphones (Realme, OnePlus, Samsung, Xiaomi), GaN fast chargers, AMOLED smartwatches, and JBL/boAt Bluetooth audio gear.\n\nAll products come with genuine brand seals and local Lucknow warranty support. Feel free to browse our storefront or ask for specific product recommendations!';
  }

  return '👋 Welcome to **Javed Electronics Customer Support**!\n\nI can help you with:\n• 📦 Tracking your order status\n• ⚡ 4-Hour express local delivery & serviceable pincodes\n• 🏪 Lucknow branch timings & store pickup\n• 🏷️ Bulk volume discount tiers\n• 🧾 B2B GST invoices & ITC\n\nFeel free to ask any question, or connect with our Hazratganj team via WhatsApp at **+91 98390 12345**!';
}

// Fallback intelligent domain product segregation & margin engine
function generateProductFallback(params: {
  rawTitle: string;
  brand: string;
  category: string;
  mrp: number;
  purchaseCost: number;
  rawNotes: string;
}) {
  const combined = `${params.rawTitle} ${params.brand} ${params.category} ${params.rawNotes}`.toLowerCase();

  // Brand detection
  let detectedBrand = params.brand.trim();
  if (!detectedBrand) {
    if (combined.includes('boat')) detectedBrand = 'boAt';
    else if (combined.includes('xiaomi') || combined.includes('redmi') || combined.includes('mi ')) detectedBrand = 'Xiaomi';
    else if (combined.includes('samsung') || combined.includes('galaxy')) detectedBrand = 'Samsung';
    else if (combined.includes('oneplus')) detectedBrand = 'OnePlus';
    else if (combined.includes('apple') || combined.includes('iphone') || combined.includes('airpods')) detectedBrand = 'Apple';
    else if (combined.includes('realme')) detectedBrand = 'Realme';
    else if (combined.includes('noise')) detectedBrand = 'Noise';
    else if (combined.includes('jbl')) detectedBrand = 'JBL';
    else if (combined.includes('sony')) detectedBrand = 'Sony';
    else if (combined.includes('anker')) detectedBrand = 'Anker';
    else if (combined.includes('portronics')) detectedBrand = 'Portronics';
    else detectedBrand = 'Javed Select';
  }

  // Category detection
  let detectedCategory = params.category;
  if (!detectedCategory || detectedCategory === 'smartphones') {
    if (combined.includes('earbud') || combined.includes('headphone') || combined.includes('audio') || combined.includes('speaker') || combined.includes('airpods') || combined.includes('soundbar') || combined.includes('rockerz') || combined.includes('airdopes')) {
      detectedCategory = 'audio';
    } else if (combined.includes('watch') || combined.includes('smartwatch') || combined.includes('band')) {
      detectedCategory = 'smartwatches';
    } else if (combined.includes('charger') || combined.includes('cable') || combined.includes('adapter') || combined.includes('powerbank') || combined.includes('gan')) {
      detectedCategory = 'chargers_cables';
    } else if (combined.includes('tv') || combined.includes('television') || combined.includes('led') || combined.includes('monitor')) {
      detectedCategory = 'tvs_accessories';
    } else if (combined.includes('mouse') || combined.includes('keyboard') || combined.includes('usb') || combined.includes('hard disk') || combined.includes('laptop')) {
      detectedCategory = 'computer_accessories';
    } else if (combined.includes('kettle') || combined.includes('iron') || combined.includes('mixer') || combined.includes('purifier') || combined.includes('blender')) {
      detectedCategory = 'small_appliances';
    } else {
      detectedCategory = 'smartphones';
    }
  }

  // Clean Title formatting
  let cleanTitle = params.rawTitle.trim();
  if (!cleanTitle) {
    cleanTitle = `${detectedBrand} Premium Series ${detectedCategory.replace('_', ' ').toUpperCase()}`;
  } else if (!cleanTitle.toLowerCase().startsWith(detectedBrand.toLowerCase())) {
    cleanTitle = `${detectedBrand} ${cleanTitle}`;
  }

  // Pricing & margin calculations
  let mrp = params.mrp || 0;
  let purchaseCost = params.purchaseCost || 0;
  let salePrice = 0;

  if (mrp > 0 && purchaseCost > 0) {
    // 25% margin over cost, capped under MRP
    const targetWithMargin = Math.round(purchaseCost * 1.25);
    const maxDiscounted = Math.round(mrp * 0.85);
    salePrice = Math.min(Math.max(targetWithMargin, purchaseCost + 50), maxDiscounted);
    if (salePrice >= mrp) {
      salePrice = Math.round(mrp * 0.9);
    }
  } else if (mrp > 0) {
    salePrice = Math.round(mrp * 0.78);
    purchaseCost = Math.round(salePrice * 0.78);
  } else if (purchaseCost > 0) {
    salePrice = Math.round(purchaseCost * 1.28);
    mrp = Math.round(salePrice * 1.35);
  } else {
    mrp = 2999;
    purchaseCost = 1450;
    salePrice = 1899;
  }

  const grossMargin = salePrice > purchaseCost
    ? Math.round(((salePrice - purchaseCost) / salePrice) * 1000) / 10
    : 18.5;

  // HSN Codes by category
  const hsnMap: Record<string, string> = {
    smartphones: '8517',
    audio: '8518',
    chargers_cables: '8504',
    smartwatches: '8517',
    tvs_accessories: '8528',
    computer_accessories: '8471',
    home_electronics: '8509',
    small_appliances: '8516',
  };

  const hsnCode = hsnMap[detectedCategory] || '8517';

  // Category specific specs
  let specs: Record<string, string> = {
    'Brand Warranty': '1 Year Official Manufacturer Warranty',
    'GST Invoice': 'Input Tax Credit (ITC) Eligible',
    'Origin': 'Genuine Sealed Pack India Unit',
  };

  if (detectedCategory === 'audio') {
    specs = {
      ...specs,
      'Connectivity': 'Bluetooth 5.3 Low Latency',
      'Battery Playtime': 'Up to 30 Hours Total',
      'Drivers': 'Custom High-Fidelity Drivers',
      'Charging': 'Type-C ASAP Fast Charging',
    };
  } else if (detectedCategory === 'smartphones') {
    specs = {
      ...specs,
      'Network': '5G Dual SIM Active VoLTE',
      'Display': 'FHD+ AMOLED High Refresh Rate',
      'Battery': '5000mAh with Fast In-box Charger',
      'Security': 'In-display Fingerprint + Face Unlock',
    };
  } else if (detectedCategory === 'chargers_cables') {
    specs = {
      ...specs,
      'Power Output': 'Fast Turbo Power Delivery (PD)',
      'Cable Type': 'Braided Heavy-Duty Type-C',
      'Protection': 'Over-voltage & Surge Protection Sockets',
    };
  } else if (detectedCategory === 'smartwatches') {
    specs = {
      ...specs,
      'Display': 'HD AMOLED Curved Edge Touchscreen',
      'Sensors': 'SpO2, 24/7 Heart Rate, Sleep Tracking',
      'Water Resistance': 'IP68 Swim & Splash Resistant',
      'Battery': 'Up to 7 Days Battery Life',
    };
  }

  const seoTitle = `Buy ${cleanTitle} Lucknow | Best Price & Fast Delivery`;
  const seoDescription = `Order authentic ${cleanTitle} at Javed Electronics Lucknow for ₹${salePrice.toLocaleString('en-IN')}. 100% Genuine with GST invoice & 4-hour doorstep delivery.`;

  const description = `${cleanTitle} delivers enterprise-grade reliability and outstanding daily performance. Sourced directly from authorized distributors for Javed Electronics retail customers in Lucknow.\n\nKey Highlights:\n• 100% Original Brand sealed unit with 1-Year National Warranty.\n• Same-day 4-Hour express local delivery across Lucknow serviceable pincodes.\n• Tax invoice with GST Input Tax Credit (ITC) for business purchases.\n• Ready for instant counter pickup at Hazratganj, Gomti Nagar, Alambagh, or Chowk branches.`;

  return {
    name: cleanTitle,
    brand: detectedBrand,
    categoryId: detectedCategory,
    description,
    seoTitle: seoTitle.slice(0, 65),
    seoDescription: seoDescription.slice(0, 155),
    recommendedSalePrice: salePrice,
    mrp,
    purchaseCost,
    grossMarginPercent: grossMargin,
    hsnCode,
    gstRate: 18,
    warrantyMonths: 12,
    specifications: specs,
    pricingRationale: `Optimized at ₹${salePrice} to provide customer ₹${mrp - salePrice} savings (${Math.round(((mrp - salePrice) / mrp) * 100)}% off MRP) while maintaining a healthy ${grossMargin}% retail gross margin for the store.`,
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback for HTML5 SPA routing in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    console.error('Server listen error:', err);
    process.exit(1);
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

startServer();
