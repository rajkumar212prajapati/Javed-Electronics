import { ChatbotAiSettings, ChatbotKnowledgeItem } from '../types';

export const INITIAL_CHATBOT_KNOWLEDGE_BASE: ChatbotKnowledgeItem[] = [
  {
    id: 'kb-order-track',
    category: 'orders',
    question: 'How do I track my order or check current delivery status?',
    keywords: ['track', 'order status', 'where is my order', 'track order', 'consignment', 'shipment', 'tracking'],
    answer:
      'You can track your order in real-time right here!\n\n• Enter your **Order ID** (e.g. `JE-2026-000113`) in the chat or click **Track Shipment** in your Account.\n• Local orders within Nalasopara / Vasai include **Live In-House Rider Tracking** with direct phone contact.\n• Regional courier dispatches include real-time **Shiprocket AWB tracking** updates.',
    suggestedAction: {
      label: 'Open Order Tracking',
      actionType: 'order_tracking',
      iconType: 'package',
    },
    isActive: true,
    priority: 10,
    timesAnswered: 24,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-express-delivery',
    category: 'delivery',
    question: 'How does fast express delivery work and what are the delivery charges?',
    keywords: ['delivery', 'fast delivery', 'delivery time', 'express', 'shipping charges', 'free delivery', '4-hour', 'same day'],
    answer:
      'Javed Electronics provides high-speed express dispatch across Nalasopara, Vasai & Mumbai MMR, plus local Lucknow hubs:\n\n• **Hyperlocal Express (60 - 180 Mins):** Orders placed before 6:00 PM are dispatched directly from our flagship counter.\n• **Free Delivery:** Applicable on all cart totals over ₹799 (standard fee ₹49 for smaller carts).\n• **Doorstep Verification:** Real-time OTP / Cash on Delivery verification with delivery agent.',
    suggestedAction: {
      label: 'Check Pincode Serviceability',
      actionType: 'pincode_check',
      iconType: 'truck',
    },
    isActive: true,
    priority: 9,
    timesAnswered: 42,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-je-assured',
    category: 'warranty_assured',
    question: 'What is JE Assured quality guarantee and brand warranty?',
    keywords: ['je assured', 'assured', 'value 365', 'warranty', 'guarantee', 'genuine', 'original', 'counterfeit'],
    answer:
      '**JE Assured** is our gold-standard quality certification for all electronics:\n\n• **100% Genuine Products:** Sourced directly from authorized brand distributors (Xiaomi, boAt, Sony, Realme, OnePlus, etc.).\n• **Tested Before Dispatch:** Visual and functional multi-point check.\n• **Official Brand Warranty:** 1 to 2 Years manufacturer warranty valid at all official service centers across India.\n• **7-Day Doorstep Replacement:** Instant support for any verified manufacturing defects.',
    isActive: true,
    priority: 9,
    timesAnswered: 31,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-store-branches',
    category: 'outlets',
    question: 'Where are your store branches located and what are opening hours?',
    keywords: ['store location', 'branch', 'address', 'shop', 'outlet', 'timing', 'visit store', 'hours', 'nalasopara'],
    answer:
      'You are welcome to visit our retail counters or choose Store Pickup (ready in 30 mins!):\n\n• **Nalasopara Flagship Hub:** Shop 09, Sai Dham Apt, Vijaynagar, Nalasopara East, Palghar - 401209 (Open 10:00 AM – 9:30 PM)\n• **Hazratganj Tech Store:** Janpath Market, Hazratganj, Lucknow (Open 10:00 AM – 9:30 PM)\n• **Gomti Nagar Branch:** Vibhuti Khand, near Riverside Mall, Lucknow (Open 10:30 AM – 10:00 PM)\n• **Helpline & Store Counter:** +91 98390 12345',
    suggestedAction: {
      label: 'Chat with Branch on WhatsApp',
      actionType: 'whatsapp',
      iconType: 'whatsapp',
    },
    isActive: true,
    priority: 8,
    timesAnswered: 19,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-return-exchange',
    category: 'warranty_assured',
    question: 'What is your return, exchange, and RTO policy?',
    keywords: ['return', 'exchange', 'rto', 'replacement', 'damaged', 'refund', 'money back'],
    answer:
      'We offer a hassle-free **7-Day Doorstep Replacement Guarantee**:\n\n• If your product arrives damaged or has a technical defect, request a replacement via your Order History or WhatsApp.\n• An executive will inspect and exchange it at your doorstep or arrange a full refund.\n• **RTO Support:** If a delivery attempt fails due to address unavailability, store managers can re-dispatch or review immediately.',
    suggestedAction: {
      label: 'Contact Support on WhatsApp',
      actionType: 'whatsapp',
      iconType: 'whatsapp',
    },
    isActive: true,
    priority: 8,
    timesAnswered: 17,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-refer-earn-coupons',
    category: 'coupons_referrals',
    question: 'How does Refer & Earn work and what coupon codes can I use?',
    keywords: ['refer', 'earn', 'coupon', 'promo code', 'discount code', 'referral', 'cashback', 'reward'],
    answer:
      'Save big with our customer rewards & coupons:\n\n• **Refer & Earn Program:** Share your unique referral link from your Account profile. Your friend gets **₹100 instant bonus** on their first order, and you earn **₹150 wallet credit**!\n• **Active Codes:**\n  - `FLASH500` — Flat ₹500 off on tech orders over ₹2,999\n  - `AUDIO10` — Extra 10% off earphones & soundbars\n  - `FESTIVE10` — Festive clearance discount\n• Enter the code at checkout in the **Apply Coupon** box.',
    suggestedAction: {
      label: 'Explore Active Promotions',
      actionType: 'promotional_page',
      actionTarget: 'weekend-flash-hours',
      iconType: 'link',
    },
    isActive: true,
    priority: 7,
    timesAnswered: 28,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-payment-methods',
    category: 'payments',
    question: 'What payment methods do you accept (COD, UPI QR, Cards)?',
    keywords: ['payment', 'cod', 'cash on delivery', 'upi', 'gpay', 'phonepe', 'card', 'emi'],
    answer:
      'We support multiple secure payment options:\n\n• **Cash on Delivery (COD):** Pay cash directly to the delivery rider upon unboxing inspection.\n• **Doorstep Dynamic UPI QR:** Scan & pay using PhonePe, Google Pay, Paytm, or BHIM.\n• **Online Checkout:** Credit/Debit Cards, Netbanking, and UPI with instant automated confirmation.\n• Zero hidden fees or convenience surcharges.',
    isActive: true,
    priority: 7,
    timesAnswered: 15,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-b2b-gst',
    category: 'payments',
    question: 'Can I get a B2B GST tax invoice with Input Tax Credit (ITC)?',
    keywords: ['gst', 'b2b', 'invoice', 'itc', 'tax invoice', 'tax credit', 'gstin'],
    answer:
      'Yes, absolutely! We are 100% GST compliant:\n\n• Enter your **15-digit GSTIN** and legal business name during checkout.\n• Receive an official GST Tax Invoice with complete **HSN breakdown** (CGST, SGST, IGST).\n• All B2B purchases are uploaded for seamless GSTR-2B Input Tax Credit filing.\n• Download invoices anytime from your Order Tracking page.',
    isActive: true,
    priority: 6,
    timesAnswered: 11,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-bulk-discounts',
    category: 'products',
    question: 'Do you offer bulk purchase volume discounts for corporate or quantity orders?',
    keywords: ['bulk', 'wholesale', 'corporate', 'large order', 'quantity discount', 'volume'],
    answer:
      'Yes! Bulk discounts apply automatically in your cart:\n\n• **Tier 1 (3+ items):** Extra 5% off subtotal\n• **Tier 2 (6+ items):** Extra 10% off subtotal\n• **Tier 3 (10+ items):** Extra 15% off subtotal\n• Ideal for corporate gifting, office equipment, festive rewards, and bulk accessory orders.',
    isActive: true,
    priority: 6,
    timesAnswered: 9,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
  {
    id: 'kb-whatsapp-ordering',
    category: 'general',
    question: 'How do I place an order directly on WhatsApp?',
    keywords: ['whatsapp', 'order on whatsapp', 'click to chat', 'human support', 'speak to agent'],
    answer:
      'You can order seamlessly on WhatsApp in seconds:\n\n• In your Cart, click **"Order on WhatsApp"**.\n• A formatted order summary with item names, prices, delivery address, and invoice totals will automatically load into WhatsApp.\n• Our team confirms your order and dispatches it immediately!',
    suggestedAction: {
      label: 'Open WhatsApp Chat',
      actionType: 'whatsapp',
      iconType: 'whatsapp',
    },
    isActive: true,
    priority: 6,
    timesAnswered: 35,
    lastUpdated: '2026-10-31T12:00:00.000Z',
  },
];

export const INITIAL_CHATBOT_AI_SETTINGS: ChatbotAiSettings = {
  botName: 'Javed Support AI',
  welcomeGreeting:
    "Hello! 👋 I'm **Javed**, your digital assistant for Javed Electronics.\n\nI can help you with:\n• **Real-Time Order Tracking** & delivery status\n• **Hyperlocal Fast Delivery** in Nalasopara, Vasai & Lucknow\n• **JE Assured** quality & brand warranty details\n• **Branch Locations**, opening hours & Store Pickup\n• **Refer & Earn**, wallet rewards & active coupon codes\n\nFeel free to ask any question or tap one of the quick suggestions below!",
  systemPersonaPrompt: `You are "Javed", the friendly, knowledgeable customer support AI for Javed Electronics - India's trusted retail & digital electronics destination with flagship operations in Nalasopara East (Palghar / Mumbai MMR) and Lucknow hubs.
Key Business Information:
- Brand Promise: "JE Assured" (100% genuine products, tested quality, 7-day doorstep replacement, official manufacturer warranty).
- Store Flagship: Shop 09, Sai Dham Apt, Vijaynagar, Nalasopara East, Palghar - 401209 (Open 10:00 AM - 9:30 PM).
- Branches: Hazratganj Janpath Market, Gomti Nagar Riverside Mall, Alambagh, Chowk.
- Delivery: 60-180 min hyperlocal express dispatch in serviceable zones. Free delivery on orders over ₹799.
- Payment Options: Cash on Delivery (COD), Doorstep Dynamic UPI QR (GPay/PhonePe), Online Cards/Netbanking.
- Customer Care: Phone +91 98390 12345, instant WhatsApp support.
- Bulk Volume Discounts: 3+ items save 5%, 6+ items save 10%, 10+ items save 15%.
- Referral Bonus: Referrer gets ₹150 wallet credit, new friend gets ₹100 welcome bonus.

Guidelines:
- Always answer politely, concisely, and with enthusiasm.
- If asked about an order, invite them to provide their Order ID (JE-2026-XXXXXX).
- Use clear bullet points and bold highlights for readability on mobile screens.
- When appropriate, mention WhatsApp chat or store helpline.`,
  temperature: 0.5,
  enableGeminiAi: true,
  quickPromptPills: [
    { id: 'p1', label: '📦 Track an order', query: 'Can you help me track my recent order?' },
    { id: 'p2', label: '⚡ Fast Delivery', query: 'How does fast express delivery work and what are the charges?' },
    { id: 'p3', label: '🛡️ JE Assured Guarantee', query: 'What is JE Assured quality guarantee and warranty policy?' },
    { id: 'p4', label: '🏪 Branch Locations', query: 'Where are your store branches located and what are timings?' },
    { id: 'p5', label: '🎁 Refer & Coupons', query: 'How does Refer & Earn work and what coupon codes can I use?' },
  ],
  fallbackHelpline: '+91 98390 12345',
  fallbackWhatsapp: '919839012345',
  knowledgeBase: INITIAL_CHATBOT_KNOWLEDGE_BASE,
};
