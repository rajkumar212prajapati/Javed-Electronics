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

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionButtons?: Array<{
    label: string;
    action?: () => void;
    url?: string;
    icon?: React.ReactNode;
  }>;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'msg_welcome',
  sender: 'bot',
  text: "Hello! 👋 I'm **Javed**, your digital assistant for Javed Electronics Lucknow.\n\nHow can I help you today? You can ask me about **4-hour local delivery**, **tracking your order**, **bulk volume discounts**, **Lucknow branch timings**, or **B2B GST invoices**.",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const CustomerSupportChatbot: React.FC = () => {
  const {
    settings,
    orders,
    cart,
    bulkDiscountRules,
    outlets,
    setActiveModal,
    setSelectedOrderForModal,
    brandingSettings,
  } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('je_support_chat_history');
    return saved ? JSON.parse(saved) : [INITIAL_GREETING];
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

  // Persist chat history to localStorage
  useEffect(() => {
    localStorage.setItem('je_support_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Quick Action Prompts
  const quickPrompts = [
    { label: '📦 Track an order', query: 'Can you help me track my recent order?' },
    { label: '⚡ 4-Hour delivery', query: 'How does 4-hour express delivery in Lucknow work?' },
    { label: '🏪 Branch locations', query: 'Where are your store branches in Lucknow and what are the timings?' },
    { label: '🏷️ Bulk discounts', query: 'What bulk order volume discount rules do you offer?' },
    { label: '🧾 B2B GST tax credit', query: 'How do I get a B2B GST invoice with Input Tax Credit?' },
  ];

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
      // Build history for API
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const botReply = data.reply || "I'm here to help! Could you please clarify your request?";

      // Determine contextual action buttons based on query / answer
      const actionButtons: ChatMessage['actionButtons'] = [];
      const lowerText = textToSend.toLowerCase();

      // If user is asking about order tracking and has recent orders
      if (
        (lowerText.includes('order') || lowerText.includes('track') || lowerText.includes('status')) &&
        orders.length > 0
      ) {
        const latestOrder = orders[0];
        actionButtons.push({
          label: `Track Order #${latestOrder.id}`,
          icon: <Package className="w-3.5 h-3.5" />,
          action: () => {
            setSelectedOrderForModal(latestOrder);
            setActiveModal('order_tracking');
          },
        });
      }

      // If user asks about delivery / pincode
      if (lowerText.includes('delivery') || lowerText.includes('pincode') || lowerText.includes('area')) {
        actionButtons.push({
          label: 'Check Pincode Serviceability',
          icon: <Truck className="w-3.5 h-3.5" />,
          action: () => {
            setActiveModal('pincode_check');
          },
        });
      }

      // WhatsApp escalation button always available if human help is needed
      if (lowerText.includes('human') || lowerText.includes('staff') || lowerText.includes('manager') || lowerText.includes('speak') || lowerText.includes('call')) {
        const waUrl = getWhatsAppClickToChatUrl(
          brandingSettings.supportWhatsApp || settings.whatsappNumber,
          `Hello Javed Electronics support! I am chatting on the website and need assistance regarding: "${textToSend}"`
        );
        actionButtons.push({
          label: 'Chat with Human Support on WhatsApp',
          icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />,
          url: waUrl,
        });
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
      console.error('Failed to get bot response', err);

      // Graceful offline fallback
      const waUrl = getWhatsAppClickToChatUrl(settings.whatsappNumber, 'Hello Javed Electronics support!');
      const botMsg: ChatMessage = {
        id: `msg_b_${Date.now()}`,
        sender: 'bot',
        text: "I'm having trouble connecting right now, but our support team is available live!\n\n• **Customer Helpline:** +91 98390 12345\n• **Hazratganj Flagship:** 10:00 AM - 9:30 PM\n• **WhatsApp Support:** Instant click-to-chat available anytime.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionButtons: [
          {
            label: 'Open WhatsApp Support',
            icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />,
            url: waUrl,
          },
        ],
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([INITIAL_GREETING]);
    localStorage.removeItem('je_support_chat_history');
  };

  // Simple formatting helper for bold text and bullet points
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      // Parse **bold** parts
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-blue-600 font-bold">•</span>
            <span>{formattedParts.slice(1)}</span>
          </div>
        );
      }

      return (
        <p key={idx} className={line.trim() === '' ? 'h-2' : 'my-0.5'}>
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right, above MobileBottomNav on mobile) */}
      <div className="fixed bottom-16 md:bottom-5 right-3.5 sm:right-6 z-40 flex flex-col items-end no-print">
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
                    Javed Support AI
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 uppercase">
                    Lucknow Hub
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
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
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
                              {btn.icon}
                              <span>{btn.label}</span>
                              <ExternalLink className="w-3 h-3 ml-auto text-emerald-500" />
                            </a>
                          ) : (
                            <button
                              key={btnIdx}
                              onClick={btn.action}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                            >
                              {btn.icon}
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
