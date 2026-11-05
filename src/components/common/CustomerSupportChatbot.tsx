import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { getWhatsAppClickToChatUrl } from '../../utils/whatsapp';
import { formatINR } from '../../utils/currency';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Clock,
  RotateCcw,
  Truck,
  Package,
  Building2,
  Percent,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

import { INITIAL_CHATBOT_AI_SETTINGS } from '../../data/chatbotKnowledgeData';
import { safeLocalStorageSetItem } from '../../utils/storage';

interface ChatMessageAction {
  label: string;
  actionType?: 'order_tracking' | 'pincode_check' | 'whatsapp' | 'promotional_page';
  orderId?: string;
  actionTarget?: string;
  url?: string;
  iconType?: 'package' | 'truck' | 'whatsapp' | 'link';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionButtons?: ChatMessageAction[];
}

export const CustomerSupportChatbot: React.FC = () => {
  const {
    settings,
    orders,
    cart,
    bulkDiscountRules,
    outlets,
    activeOutlet,
    setActiveModal,
    setSelectedOrderForModal,
    brandingSettings,
    chatbotAiSettings,
    updateKnowledgeItem,
    openPromotionalPageBySlug,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const defaultGreetingText = chatbotAiSettings?.welcomeGreeting || INITIAL_CHATBOT_AI_SETTINGS.welcomeGreeting;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('je_support_chat_history');
      if (!saved) {
        return [
          {
            id: 'msg_welcome',
            sender: 'bot',
            text: INITIAL_CHATBOT_AI_SETTINGS.welcomeGreeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [
          {
            id: 'msg_welcome',
            sender: 'bot',
            text: INITIAL_CHATBOT_AI_SETTINGS.welcomeGreeting,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return parsed.map((m: any) => ({
        id: String(m.id || Date.now()),
        sender: m.sender === 'user' ? 'user' : 'bot',
        text: typeof m.text === 'string' ? m.text : '',
        timestamp: typeof m.timestamp === 'string' ? m.timestamp : '',
        actionButtons: Array.isArray(m.actionButtons)
          ? m.actionButtons.map((b: any) => ({
              label: typeof b.label === 'string' ? b.label : 'Action',
              actionType: b.actionType,
              orderId: b.orderId,
              actionTarget: b.actionTarget,
              url: typeof b.url === 'string' ? b.url : undefined,
              iconType: typeof b.iconType === 'string' ? b.iconType : undefined,
            }))
          : undefined,
      }));
    } catch {
      return [
        {
          id: 'msg_welcome',
          sender: 'bot',
          text: INITIAL_CHATBOT_AI_SETTINGS.welcomeGreeting,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    }
  });
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen for global open event (e.g. from Header, Footer, Hero)
  useEffect(() => {
    const handleOpenEvent = () => {
      setIsOpen(true);
      setShowTooltip(false);
    };
    window.addEventListener('open-customer-support-chat', handleOpenEvent);
    return () => window.removeEventListener('open-customer-support-chat', handleOpenEvent);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Persist chat history to localStorage safely
  useEffect(() => {
    try {
      safeLocalStorageSetItem('je_support_chat_history', JSON.stringify(messages.slice(-20)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Quick Action Prompts (Admin configurable)
  const defaultQuickPrompts = [
    { id: 'qp1', label: '📦 Track an order', query: 'Can you help me track my recent order?' },
    { id: 'qp2', label: '⚡ Fast Delivery', query: 'How does fast express delivery work and what are the delivery charges?' },
    { id: 'qp3', label: '🛡️ JE Assured Guarantee', query: 'What is JE Assured quality guarantee and brand warranty?' },
    { id: 'qp4', label: '🏪 Branch Locations', query: 'Where are your store branches located and what are opening hours?' },
    { id: 'qp5', label: '🎁 Refer & Coupons', query: 'How does Refer & Earn work and what coupon codes can I use?' },
  ];

  const activeQuickPrompts =
    chatbotAiSettings?.quickPromptPills && chatbotAiSettings.quickPromptPills.length > 0
      ? chatbotAiSettings.quickPromptPills
      : defaultQuickPrompts;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const lowerText = textToSend.toLowerCase();

      // 1. Direct Order Tracking Intelligence
      // Check if user entered an Order ID pattern like JE-2026-XXXXXX or asked for their order
      const orderIdMatch = textToSend.match(/JE-\d{4}-\d{6}/i);
      if (orderIdMatch) {
        const targetId = orderIdMatch[0].toUpperCase();
        const matchedOrder = orders.find((o) => o.id.toUpperCase() === targetId);
        if (matchedOrder) {
          const statusLabel = matchedOrder.orderStatus.replace(/_/g, ' ').toUpperCase();
          const itemCount = matchedOrder.items.reduce((s, i) => s + i.quantity, 0);
          const reply = `I found your Order **#${matchedOrder.id}**!\n\n• **Status:** ${statusLabel}\n• **Items:** ${itemCount} items (${matchedOrder.items.map((i) => i.productName).slice(0, 2).join(', ')}${itemCount > 2 ? '...' : ''})\n• **Order Total:** ${formatINR(matchedOrder.finalTotal)}\n• **Delivery Slot:** ${matchedOrder.deliverySlot || 'Express Hyperlocal'}\n${matchedOrder.deliveryStaffName ? `• **Delivery Rider:** ${matchedOrder.deliveryStaffName}` : ''}\n\nClick below to view live road tracking or download your tax invoice.`;

          const botMsg: ChatMessage = {
            id: `msg_b_${Date.now()}`,
            sender: 'bot',
            text: reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionButtons: [
              {
                label: `Track Order #${matchedOrder.id}`,
                actionType: 'order_tracking',
                orderId: matchedOrder.id,
                iconType: 'package',
              },
            ],
          };
          setMessages((prev) => [...prev, botMsg]);
          setIsLoading(false);
          return;
        }
      }

      // 2. High-Accuracy Match against Admin Trained Q&A Knowledge Base
      const activeKb = chatbotAiSettings?.knowledgeBase?.filter((k) => k.isActive) || [];
      let bestKbMatch: { item: any; score: number } | null = null;
      const cleanLowerQ = lowerText.trim();

      for (const kb of activeKb) {
        let score = 0;
        const qLower = kb.question.toLowerCase().trim();

        if (cleanLowerQ === qLower) {
          score += 100;
        } else if (cleanLowerQ.includes(qLower) || qLower.includes(cleanLowerQ)) {
          score += 45;
        }

        if (Array.isArray(kb.keywords)) {
          for (const kw of kb.keywords) {
            const kwClean = kw.toLowerCase().trim();
            if (kwClean && cleanLowerQ.includes(kwClean)) {
              score += 25;
            }
          }
        }

        score += (kb.priority || 1) * 2;

        if (score >= 25 && (!bestKbMatch || score > bestKbMatch.score)) {
          bestKbMatch = { item: kb, score };
        }
      }

      // If high-confidence match (score >= 45) or Gemini is disabled, answer immediately from trained knowledge base!
      if (bestKbMatch && (bestKbMatch.score >= 45 || !chatbotAiSettings?.enableGeminiAi)) {
        updateKnowledgeItem(bestKbMatch.item.id, {
          timesAnswered: (bestKbMatch.item.timesAnswered || 0) + 1,
        });

        const actionButtons: ChatMessageAction[] = [];
        if (bestKbMatch.item.suggestedAction) {
          actionButtons.push({
            label: bestKbMatch.item.suggestedAction.label,
            actionType: bestKbMatch.item.suggestedAction.actionType,
            actionTarget: bestKbMatch.item.suggestedAction.actionTarget,
            iconType: bestKbMatch.item.suggestedAction.iconType || 'link',
          });
        }

        const botMsg: ChatMessage = {
          id: `msg_b_${Date.now()}`,
          sender: 'bot',
          text: bestKbMatch.item.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionButtons: actionButtons.length > 0 ? actionButtons : undefined,
        };

        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
        return;
      }

      // 3. Fallback or Generative Query via server /api/chat with timeout
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          history,
          knowledgeBase: activeKb,
          customSystemInstruction: chatbotAiSettings?.systemPersonaPrompt,
          temperature: chatbotAiSettings?.temperature || 0.5,
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.reply || "I'm here to help! Could you please clarify your request?";

      // Determine contextual action buttons based on query / answer
      const actionButtons: ChatMessageAction[] = [];

      if (data.suggestedAction) {
        actionButtons.push({
          label: data.suggestedAction.label,
          actionType: data.suggestedAction.actionType,
          actionTarget: data.suggestedAction.actionTarget,
          iconType: data.suggestedAction.iconType || 'link',
        });
      } else {
        if ((lowerText.includes('order') || lowerText.includes('track') || lowerText.includes('status')) && orders.length > 0) {
          const latestOrder = orders[0];
          actionButtons.push({
            label: `Track Order #${latestOrder.id}`,
            iconType: 'package',
            actionType: 'order_tracking',
            orderId: latestOrder.id,
          });
        }

        if (lowerText.includes('delivery') || lowerText.includes('pincode') || lowerText.includes('area')) {
          actionButtons.push({
            label: 'Check Pincode Serviceability',
            iconType: 'truck',
            actionType: 'pincode_check',
          });
        }

        if (lowerText.includes('human') || lowerText.includes('staff') || lowerText.includes('manager') || lowerText.includes('whatsapp') || lowerText.includes('call')) {
          const waUrl = getWhatsAppClickToChatUrl(
            chatbotAiSettings?.fallbackWhatsapp || brandingSettings.supportWhatsApp || settings.whatsappNumber,
            `Hello Javed Electronics support! I need assistance regarding: "${textToSend}"`
          );
          actionButtons.push({
            label: 'Chat with Human Support on WhatsApp',
            iconType: 'whatsapp',
            url: waUrl,
            actionType: 'whatsapp',
          });
        }
      }

      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        sender: 'bot',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButtons: actionButtons.length > 0 ? actionButtons : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot error, using trained fallback:', err);

      // Graceful trained fallback: check if we had any partial KB match
      const activeKb = chatbotAiSettings?.knowledgeBase?.filter((k) => k.isActive) || [];
      const fallbackKb = activeKb[0];
      const fallbackText = fallbackKb
        ? fallbackKb.answer
        : `Our store support team is active live!\n\n• **Store Flagship:** ${settings.address || 'Shop 09, Sai Dham Apt, Vijaynagar, Nalasopara East'}\n• **Customer Helpline:** ${chatbotAiSettings?.fallbackHelpline || '+91 98390 12345'}\n• **Store Hours:** 10:00 AM - 9:30 PM (Mon - Sun)\n• **WhatsApp Support:** Instant click-to-chat available anytime.`;

      const waUrl = getWhatsAppClickToChatUrl(
        chatbotAiSettings?.fallbackWhatsapp || settings.whatsappNumber,
        'Hello Javed Electronics support!'
      );

      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        sender: 'bot',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButtons: [
          {
            label: 'Open WhatsApp Support',
            iconType: 'whatsapp',
            url: waUrl,
            actionType: 'whatsapp',
          },
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderActionIcon = (iconType?: string) => {
    switch (iconType) {
      case 'package':
        return <Package className="w-3.5 h-3.5" />;
      case 'truck':
        return <Truck className="w-3.5 h-3.5" />;
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'link':
        return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
      default:
        return null;
    }
  };

  const handleActionClick = (btn: ChatMessageAction) => {
    if (btn.actionType === 'order_tracking') {
      const orderToTrack = orders.find((o) => o.id === btn.orderId) || orders[0];
      if (orderToTrack) {
        setSelectedOrderForModal(orderToTrack);
      }
      setActiveModal('order_tracking');
    } else if (btn.actionType === 'pincode_check') {
      setActiveModal('pincode_check');
    } else if (btn.actionType === 'whatsapp') {
      const waUrl =
        btn.url ||
        getWhatsAppClickToChatUrl(
          chatbotAiSettings?.fallbackWhatsapp || brandingSettings.supportWhatsApp || settings.whatsappNumber,
          'Hello Javed Electronics support!'
        );
      window.open(waUrl, '_blank');
    } else if (btn.actionType === 'promotional_page') {
      openPromotionalPageBySlug(btn.actionTarget || 'weekend-flash-hours');
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'msg_welcome',
        sender: 'bot',
        text: defaultGreetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    localStorage.removeItem('je_support_chat_history');
  };

  // Robust formatting helper for bold text and bullet points without slicing or blank dots
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const isBullet = line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ');
      const contentToParse = isBullet ? line.replace(/^[•\-\*]\s+/, '') : line;

      // Parse **bold** parts
      const parts = contentToParse.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-1">
            <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
            <span className="text-slate-800 leading-relaxed flex-1">{formattedParts}</span>
          </div>
        );
      }

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-0.5 text-slate-800 leading-relaxed'}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right, above Customer Portal Bottom Menu) */}
      <div className="fixed bottom-16 right-3.5 sm:right-6 z-40 flex flex-col items-end no-print">
        {/* Welcome Tooltip Bubble (Dismissible) */}
        {showTooltip && !isOpen && (
          <div className="mb-2 bg-white text-slate-800 p-3 rounded-2xl shadow-xl border border-slate-200 max-w-xs text-xs animate-in slide-in-from-bottom-2 duration-300 relative">
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute -top-1.5 -right-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full p-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Need Help? Chat with Javed!</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Ask about 4-hr delivery, branch timings, bulk discounts, or order status.
            </p>
          </div>
        )}

        {/* Floating Action Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
          }}
          className={`relative p-3.5 sm:p-4 rounded-full text-white shadow-2xl transition-all duration-300 cursor-pointer flex items-center justify-center group ${
            isOpen
              ? 'bg-slate-900 hover:bg-slate-800 rotate-90 scale-95'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:scale-105 ring-4 ring-blue-500/20 shadow-blue-500/30'
          }`}
          aria-label="Customer Support Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {/* Pulse Online Indicator */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full">
                <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"></span>
              </span>
              {hasUnread && (
                <span className="absolute -top-1 -left-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  1
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Expandable Chat Dialog Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-2 sm:right-6 z-50 w-[96vw] sm:w-[410px] h-[580px] max-h-[84vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Chat Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                    {chatbotAiSettings?.botName || 'Javed Support AI'}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
                    {activeOutlet?.city || settings.city || 'MMR & Lucknow'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate">
                  Instant answers for orders, stores & bulk rules
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Clear chat history"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick FAQ Prompts Chips Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-[11px]">
            {activeQuickPrompts.map((p, idx) => (
              <button
                key={p.id || idx}
                onClick={() => handleSendMessage(p.query)}
                disabled={isLoading}
                className="shrink-0 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors cursor-pointer whitespace-nowrap shadow-2xs disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-50/50 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Sender Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] shadow-2xs ${
                      isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-slate-200 text-indigo-700'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4 text-indigo-600" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[82%] space-y-1.5 ${isUser ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                    </div>

                    {/* Optional Contextual Action Buttons */}
                    {msg.actionButtons && msg.actionButtons.length > 0 && (
                      <div className="pt-1 flex flex-col gap-1.5">
                        {msg.actionButtons.map((btn, btnIdx) =>
                          btn.url ? (
                            <a
                              key={btnIdx}
                              href={btn.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 hover:border-emerald-400 rounded-xl text-xs font-semibold shadow-2xs transition-all text-left"
                            >
                              {renderActionIcon(btn.iconType)}
                              <span>{btn.label}</span>
                              <ExternalLink className="w-3 h-3 ml-auto text-emerald-500" />
                            </a>
                          ) : (
                            <button
                              key={btnIdx}
                              onClick={() => handleActionClick(btn)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                            >
                              {renderActionIcon(btn.iconType)}
                              <span>{btn.label}</span>
                              <ExternalLink className="w-3 h-3 ml-auto text-blue-400" />
                            </button>
                          )
                        )}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 px-1 font-mono">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 items-end">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-[11px] font-medium text-slate-600">Javed is typing</span>
                  <div className="flex items-center gap-1 ml-1">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input & Send Form */}
          <div className="p-3 border-t border-slate-200 bg-white shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask a question or track your order..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                aria-label="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1">
              <span>Javed Electronics Assistant</span>
              <a
                href={`tel:${settings.phone}`}
                className="hover:text-blue-600 transition-colors font-medium"
              >
                Call: {settings.phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
