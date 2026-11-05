import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ChatbotKnowledgeCategory,
  ChatbotKnowledgeItem,
  ChatbotKnowledgeAction,
} from '../../types';
import {
  Bot,
  Sparkles,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  RefreshCw,
  MessageSquare,
  Zap,
  HelpCircle,
  Send,
  Sliders,
  Tag,
  ShieldCheck,
  Truck,
  Package,
  Building2,
  CreditCard,
  Gift,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Eye,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

export const ChatbotAiTrainingManager: React.FC = () => {
  const {
    chatbotAiSettings,
    updateChatbotAiSettings,
    addKnowledgeItem,
    updateKnowledgeItem,
    deleteKnowledgeItem,
    toggleKnowledgeItemStatus,
    resetKnowledgeBaseToDefaults,
    orders,
    settings,
  } = useStore();

  // Active top tab in training manager
  const [activeSubTab, setActiveSubTab] = useState<'knowledge' | 'persona' | 'simulator'>('knowledge');

  // Search & category filters for knowledge base
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state for Add / Edit Knowledge Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Form fields for Knowledge Item
  const [formQuestion, setFormQuestion] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formCategory, setFormCategory] = useState<ChatbotKnowledgeCategory>('general');
  const [formAnswer, setFormAnswer] = useState('');
  const [formPriority, setFormPriority] = useState<number>(8);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [enableAction, setEnableAction] = useState<boolean>(false);
  const [actionLabel, setActionLabel] = useState('');
  const [actionType, setActionType] = useState<ChatbotKnowledgeAction['actionType']>('order_tracking');
  const [actionTarget, setActionTarget] = useState('');
  const [actionIcon, setActionIcon] = useState<ChatbotKnowledgeAction['iconType']>('package');

  // Persona settings editable state
  const [botNameEdit, setBotNameEdit] = useState(chatbotAiSettings.botName || 'Javed Support AI');
  const [welcomeGreetingEdit, setWelcomeGreetingEdit] = useState(chatbotAiSettings.welcomeGreeting || '');
  const [personaPromptEdit, setPersonaPromptEdit] = useState(chatbotAiSettings.systemPersonaPrompt || '');
  const [temperatureEdit, setTemperatureEdit] = useState(chatbotAiSettings.temperature ?? 0.3);
  const [enableGeminiEdit, setEnableGeminiEdit] = useState(chatbotAiSettings.enableGeminiAi ?? true);
  const [helplineEdit, setHelplineEdit] = useState(chatbotAiSettings.fallbackHelpline || '9172941517');
  const [whatsappEdit, setWhatsappEdit] = useState(chatbotAiSettings.fallbackWhatsapp || '919839012345');
  const [pillsEdit, setPillsEdit] = useState(chatbotAiSettings.quickPromptPills || []);
  const [newPillLabel, setNewPillLabel] = useState('');
  const [newPillQuery, setNewPillQuery] = useState('');
  const [personaSaveMsg, setPersonaSaveMsg] = useState(false);

  // Simulator state
  const [simMessages, setSimMessages] = useState<
    Array<{
      id: string;
      sender: 'user' | 'bot';
      text: string;
      timestamp: string;
      matchType?: 'trained_kb' | 'order_id' | 'gemini_ai' | 'fallback';
      matchedQuestion?: string;
      matchScore?: number;
      action?: ChatbotKnowledgeAction;
    }>
  >([
    {
      id: 'sim-welcome',
      sender: 'bot',
      text: chatbotAiSettings.welcomeGreeting,
      timestamp: 'Just now',
    },
  ]);
  const [simInput, setSimInput] = useState('');
  const [isSimTyping, setIsSimTyping] = useState(false);

  // Category statistics & badge colors
  const categoryConfig: Record<
    ChatbotKnowledgeCategory,
    { label: string; icon: React.ReactNode; color: string; bg: string }
  > = {
    orders: {
      label: 'Orders & Tracking',
      icon: <Package className="w-3.5 h-3.5" />,
      color: 'text-blue-700',
      bg: 'bg-blue-50 border-blue-200',
    },
    delivery: {
      label: 'Express Delivery',
      icon: <Truck className="w-3.5 h-3.5" />,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
    },
    products: {
      label: 'Products & Stock',
      icon: <Tag className="w-3.5 h-3.5" />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
    },
    warranty_assured: {
      label: 'Warranty & JE Assured',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      color: 'text-purple-700',
      bg: 'bg-purple-50 border-purple-200',
    },
    outlets: {
      label: 'Outlets & Timings',
      icon: <Building2 className="w-3.5 h-3.5" />,
      color: 'text-sky-700',
      bg: 'bg-sky-50 border-sky-200',
    },
    payments: {
      label: 'Payments & COD',
      icon: <CreditCard className="w-3.5 h-3.5" />,
      color: 'text-indigo-700',
      bg: 'bg-indigo-50 border-indigo-200',
    },
    coupons_referrals: {
      label: 'Coupons & Referrals',
      icon: <Gift className="w-3.5 h-3.5" />,
      color: 'text-pink-700',
      bg: 'bg-pink-50 border-pink-200',
    },
    general: {
      label: 'General & Support',
      icon: <HelpCircle className="w-3.5 h-3.5" />,
      color: 'text-slate-700',
      bg: 'bg-slate-100 border-slate-200',
    },
  };

  const knowledgeBase = chatbotAiSettings.knowledgeBase || [];

  // Filtered knowledge items
  const filteredKnowledge = useMemo(() => {
    return knowledgeBase.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchQ = item.question.toLowerCase().includes(q);
        const matchA = item.answer.toLowerCase().includes(q);
        const matchKeywords = item.keywords.some((kw) => kw.toLowerCase().includes(q));
        return matchQ || matchA || matchKeywords;
      }
      return true;
    });
  }, [knowledgeBase, selectedCategory, statusFilter, searchQuery]);

  // Overall metrics
  const totalItems = knowledgeBase.length;
  const activeItemsCount = knowledgeBase.filter((k) => k.isActive).length;
  const totalHits = knowledgeBase.reduce((sum, k) => sum + (k.timesAnswered || 0), 0);
  const categoriesCount = new Set(knowledgeBase.map((k) => k.category)).size;

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingItemId(null);
    setFormQuestion('');
    setFormKeywords('');
    setFormCategory('general');
    setFormAnswer('');
    setFormPriority(8);
    setFormIsActive(true);
    setEnableAction(false);
    setActionLabel('');
    setActionType('order_tracking');
    setActionTarget('');
    setActionIcon('package');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: ChatbotKnowledgeItem) => {
    setEditingItemId(item.id);
    setFormQuestion(item.question);
    setFormKeywords(item.keywords.join(', '));
    setFormCategory(item.category);
    setFormAnswer(item.answer);
    setFormPriority(item.priority || 8);
    setFormIsActive(item.isActive);
    if (item.suggestedAction) {
      setEnableAction(true);
      setActionLabel(item.suggestedAction.label);
      setActionType(item.suggestedAction.actionType);
      setActionTarget(item.suggestedAction.actionTarget || '');
      setActionIcon(item.suggestedAction.iconType);
    } else {
      setEnableAction(false);
      setActionLabel('');
      setActionType('order_tracking');
      setActionTarget('');
      setActionIcon('package');
    }
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveKnowledgeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || !formAnswer.trim()) {
      alert('Question and Answer are required.');
      return;
    }

    const keywordsArray = formKeywords
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    let suggestedAction: ChatbotKnowledgeAction | undefined = undefined;
    if (enableAction && actionLabel.trim()) {
      suggestedAction = {
        label: actionLabel.trim(),
        actionType,
        actionTarget: actionTarget.trim() || undefined,
        iconType: actionIcon,
      };
    }

    if (editingItemId) {
      updateKnowledgeItem(editingItemId, {
        question: formQuestion.trim(),
        keywords: keywordsArray,
        category: formCategory,
        answer: formAnswer.trim(),
        priority: Number(formPriority) || 8,
        isActive: formIsActive,
        suggestedAction,
      });
    } else {
      addKnowledgeItem({
        question: formQuestion.trim(),
        keywords: keywordsArray,
        category: formCategory,
        answer: formAnswer.trim(),
        priority: Number(formPriority) || 8,
        isActive: formIsActive,
        suggestedAction,
        timesAnswered: 0,
      });
    }

    setIsModalOpen(false);
  };

  // Handle Save Persona Settings
  const handleSavePersonaSaved = () => {
    updateChatbotAiSettings({
      botName: botNameEdit.trim() || 'Javed Support AI',
      welcomeGreeting: welcomeGreetingEdit.trim(),
      systemPersonaPrompt: personaPromptEdit.trim(),
      temperature: Number(temperatureEdit),
      enableGeminiAi: enableGeminiEdit,
      fallbackHelpline: helplineEdit.trim(),
      fallbackWhatsapp: whatsappEdit.trim(),
      quickPromptPills: pillsEdit,
    });
    setPersonaSaveMsg(true);
    setTimeout(() => setPersonaSaveMsg(false), 3000);
  };

  // Add new prompt pill
  const handleAddPromptPill = () => {
    if (!newPillLabel.trim()) return;
    const newId = `pill-${Date.now()}`;
    const updated = [
      ...pillsEdit,
      {
        id: newId,
        label: newPillLabel.trim(),
        query: newPillQuery.trim() || newPillLabel.trim(),
      },
    ];
    setPillsEdit(updated);
    setNewPillLabel('');
    setNewPillQuery('');
  };

  const handleRemovePromptPill = (id: string) => {
    setPillsEdit(pillsEdit.filter((p) => p.id !== id));
  };

  // Reset to default training data
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Are you sure you want to restore the recommended retail training Q&As? Any custom additions will be replaced with verified defaults.'
      )
    ) {
      resetKnowledgeBaseToDefaults();
    }
  };

  // Simulator Query Evaluation Engine
  const handleSimulateSubmit = (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();
    const query = (directQuery ?? simInput).trim();
    if (!query) return;

    // Append User Message
    const userMsg = {
      id: `sim-u-${Date.now()}`,
      sender: 'user' as const,
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSimMessages((prev) => [...prev, userMsg]);
    setSimInput('');
    setIsSimTyping(true);

    setTimeout(() => {
      // 1. Direct Order ID detection (JE-XXXX-XXXXXX)
      const orderIdMatch = query.match(/JE-\d{4}-\d{5,6}/i);
      if (orderIdMatch) {
        const orderId = orderIdMatch[0].toUpperCase();
        const foundOrder = orders.find((o) => o.id.toUpperCase() === orderId);

        if (foundOrder) {
          const statusText = foundOrder.orderStatus.replace(/_/g, ' ').toUpperCase();
          const rider = foundOrder.deliveryStaffName || 'In-House Courier Specialist';
          const itemsSummary = foundOrder.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ');

          const replyText = `📦 **Order Found: ${foundOrder.id}**\n\n• **Status:** ${statusText}\n• **Total Amount:** ₹${foundOrder.finalTotal.toLocaleString('en-IN')}\n• **Items:** ${itemsSummary}\n• **Assigned Rider:** ${rider}\n• **Destination:** ${foundOrder.customer.address}, ${foundOrder.customer.area}`;

          setSimMessages((prev) => [
            ...prev,
            {
              id: `sim-b-${Date.now()}`,
              sender: 'bot',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              matchType: 'order_id',
              matchedQuestion: `Live lookup for ${foundOrder.id}`,
              matchScore: 100,
              action: {
                label: 'View In-App Road Route Navigation',
                actionType: 'order_tracking',
                actionTarget: foundOrder.id,
                iconType: 'package',
              },
            },
          ]);
          setIsSimTyping(false);
          return;
        }
      }

      // 2. Trained Knowledge Base Scoring
      const normalizedQuery = query.toLowerCase();
      let bestMatch: ChatbotKnowledgeItem | null = null;
      let highestScore = 0;

      for (const item of knowledgeBase) {
        if (!item.isActive) continue;
        let score = 0;

        // Exact match
        if (normalizedQuery === item.question.toLowerCase()) {
          score += 100;
        }

        // Keywords match
        for (const kw of item.keywords) {
          const cleanKw = kw.toLowerCase();
          if (normalizedQuery.includes(cleanKw)) {
            score += cleanKw.length > 5 ? 30 : 15;
          }
        }

        // Partial match with question
        const questionWords = item.question
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3);
        for (const w of questionWords) {
          if (normalizedQuery.includes(w)) {
            score += 10;
          }
        }

        // Weight by priority
        score += (item.priority || 5) * 2;

        if (score > highestScore) {
          highestScore = score;
          bestMatch = item;
        }
      }

      // If good match found
      if (bestMatch && highestScore >= 20) {
        setSimMessages((prev) => [
          ...prev,
          {
            id: `sim-b-${Date.now()}`,
            sender: 'bot',
            text: bestMatch!.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            matchType: 'trained_kb',
            matchedQuestion: bestMatch!.question,
            matchScore: Math.min(100, highestScore),
            action: bestMatch!.suggestedAction,
          },
        ]);
        setIsSimTyping(false);
        return;
      }

      // 3. Fallback / Generative AI simulation
      const fallbackReply = `Thanks for reaching out! While this specific query isn't in our instant FAQ library, our team at Javed Electronics is here to help.\n\n• For order questions, please share your **JE-2026-XXXXXX** order number.\n• You can also chat directly with our store manager on WhatsApp at **+${whatsappEdit}** or call **${helplineEdit}**.\n• Store hours: 10:00 AM – 9:30 PM (Daily).`;

      setSimMessages((prev) => [
        ...prev,
        {
          id: `sim-b-${Date.now()}`,
          sender: 'bot',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          matchType: enableGeminiEdit ? 'gemini_ai' : 'fallback',
          matchedQuestion: 'Generative AI Response & Live Store Helpline',
          matchScore: 75,
          action: {
            label: 'Connect with Store on WhatsApp',
            actionType: 'whatsapp',
            iconType: 'whatsapp',
          },
        },
      ]);
      setIsSimTyping(false);
    }, 400);
  };

  // Formatted preview renderer for Markdown bullets and bold text
  const renderFormattedPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-xs text-slate-800 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          const isBullet = /^[•\-\*]\s+/.test(line);
          const rawContent = isBullet ? line.replace(/^[•\-\*]\s+/, '') : line;

          const parts = rawContent.split(/(\*\*.*?\*\*)/g);
          const formatted = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-bold text-slate-950">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return <span key={pIdx}>{part}</span>;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-blue-600 font-bold leading-tight select-none">•</span>
                <span className="flex-1">{formatted}</span>
              </div>
            );
          }

          return <p key={idx}>{formatted}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-blue-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Training &amp; Knowledge Base</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
              ⚡ Instant &lt;50ms Response
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            AI Customer Chatbot &amp; Training Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Train your store&apos;s automated customer assistant with verified Q&amp;As, order tracking rules,
            JE Assured warranty terms, outlet locations, and custom system personas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Training Q&amp;A</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restore default comprehensive retail electronics training pairs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Trained Q&amp;As
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 font-mono">{totalItems}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{activeItemsCount} Active &amp; Ready</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Categories Covered
          </div>
          <div className="text-2xl font-black text-indigo-700 mt-1 font-mono">
            {categoriesCount}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Orders, Outlets, Warranty</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Questions Answered
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1 font-mono">{totalHits}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Automated customer queries</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            AI Engine Model
          </div>
          <div className="text-sm font-black text-purple-700 mt-2 truncate">Gemini 2.5 Flash</div>
          <div className="text-[10px] text-purple-600 font-semibold mt-0.5">
            {chatbotAiSettings.enableGeminiAi ? '🟢 Hybrid Gemini Enabled' : '🟡 Rule-Engine Only'}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Live Assistant Name
          </div>
          <div className="text-sm font-black text-slate-900 mt-2 truncate">
            {chatbotAiSettings.botName}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
            Helpline: {chatbotAiSettings.fallbackHelpline}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('knowledge')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'knowledge'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Q&amp;A Knowledge Base ({filteredKnowledge.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('persona')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'persona'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Bot Persona &amp; Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('simulator')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Interactive Chatbot Simulator</span>
        </button>
      </div>

      {/* TAB 1: KNOWLEDGE BASE (Q&A TRAINING) */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by question, answer, keywords, or triggers..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryConfig).map(([catKey, conf]) => (
                  <option key={catKey} value={catKey}>
                    {conf.label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({knowledgeBase.length})
            </button>
            {Object.entries(categoryConfig).map(([catKey, conf]) => {
              const count = knowledgeBase.filter((k) => k.category === catKey).length;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 cursor-pointer transition-all ${
                    selectedCategory === catKey
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{conf.label}</span>
                  <span className="opacity-70 font-mono text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Knowledge Cards List */}
          {filteredKnowledge.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No training items match your filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing search terms, selecting &quot;All Categories&quot;, or click &quot;Add Training Q&amp;A&quot; to
                teach the chatbot new answers.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Training Q&amp;A</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredKnowledge.map((item) => {
                const conf = categoryConfig[item.category] || categoryConfig.general;
                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      item.isActive
                        ? 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        {/* Badges Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center gap-1 ${conf.bg} ${conf.color}`}
                          >
                            {conf.icon}
                            <span>{conf.label}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                            Priority: {item.priority || 5}/10
                          </span>

                          {item.timesAnswered ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                              ⚡ {item.timesAnswered} hits
                            </span>
                          ) : null}

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        {/* Question */}
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {item.question}
                        </h3>

                        {/* Keywords Tag Chips */}
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">Triggers:</span>
                            {item.keywords.map((kw, kwIdx) => (
                              <span
                                key={kwIdx}
                                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Answer Preview */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                          {renderFormattedPreview(item.answer)}
                        </div>

                        {/* Suggested Action Button Preview */}
                        {item.suggestedAction && (
                          <div className="flex items-center gap-2 pt-1 text-xs">
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5">
                              <Zap className="w-3 h-3 text-amber-500" />
                              <span>Action Button: &quot;{item.suggestedAction.label}&quot;</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        {/* Active Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => toggleKnowledgeItemStatus(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {item.isActive ? 'Turn Off' : 'Turn On'}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                            title="Edit Training Item"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete question: "${item.question}"?`)) {
                                deleteKnowledgeItem(item.id);
                              }
                            }}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOT PERSONA & SETTINGS */}
      {activeSubTab === 'persona' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Customer AI Persona &amp; Assistant Voice</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure brand name, welcome greeting, response temperature, and fallback numbers.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Assistant Display Name:
                  </label>
                  <input
                    type="text"
                    value={botNameEdit}
                    onChange={(e) => setBotNameEdit(e.target.value)}
                    placeholder="e.g. Javed Support AI"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Temperature ({temperatureEdit}):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={temperatureEdit}
                      onChange={(e) => setTemperatureEdit(Number(e.target.value))}
                      className="w-full cursor-pointer accent-blue-600"
                    />
                    <span className="font-mono font-bold text-slate-800 shrink-0 w-8">
                      {temperatureEdit}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Lower values (0.1 - 0.3) provide precise, deterministic retail answers.
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Welcome Greeting Message (Markdown Supported):
                </label>
                <textarea
                  rows={4}
                  value={welcomeGreetingEdit}
                  onChange={(e) => setWelcomeGreetingEdit(e.target.value)}
                  placeholder="Welcome message rendered when customer opens chat..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  Tip: Use &quot;• **Bold Title:** Details&quot; to render neat bullet points without empty dots.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  System Persona Prompt &amp; Retail Knowledge (for Gemini API):
                </label>
                <textarea
                  rows={6}
                  value={personaPromptEdit}
                  onChange={(e) => setPersonaPromptEdit(e.target.value)}
                  placeholder="Instructions for Gemini Flash model regarding store location, policies, and behavior..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  The verified Q&amp;As from your Knowledge Base are automatically injected as ground truth into this prompt.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Store Helpline Phone:
                  </label>
                  <input
                    type="text"
                    value={helplineEdit}
                    onChange={(e) => setHelplineEdit(e.target.value)}
                    placeholder="e.g. 9172941517"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Support WhatsApp Number:
                  </label>
                  <input
                    type="text"
                    value={whatsappEdit}
                    onChange={(e) => setWhatsappEdit(e.target.value)}
                    placeholder="e.g. 919839012345"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Gemini AI toggle */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Gemini 2.5 Flash Generative AI Fallback</span>
                  </div>
                  <p className="text-[11px] text-purple-800 mt-0.5">
                    When no exact Q&amp;A is matched, ask Gemini AI using your verified store knowledge.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGeminiEdit}
                    onChange={(e) => setEnableGeminiEdit(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Quick Prompt Pills Management */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block">
                    Quick Prompt Pills (Displayed below Welcome Message):
                  </span>
                  <span className="text-[10px] text-slate-500">{pillsEdit.length} Pills Active</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {pillsEdit.map((pill) => (
                    <span
                      key={pill.id}
                      className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-medium text-xs flex items-center gap-1.5"
                    >
                      <span>{pill.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePromptPill(pill.id)}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add new pill row */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newPillLabel}
                    onChange={(e) => setNewPillLabel(e.target.value)}
                    placeholder="Pill Button Label (e.g. ⚡ 4-Hour Delivery)"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newPillQuery}
                    onChange={(e) => setNewPillQuery(e.target.value)}
                    placeholder="Query triggered when clicked"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddPromptPill}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-bold text-xs cursor-pointer hover:bg-slate-700"
                  >
                    + Add Pill
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSavePersonaSaved}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Persona &amp; Bot Settings</span>
                </button>

                {personaSaveMsg && (
                  <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Settings updated and active!</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Preview Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">{botNameEdit}</h4>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Customer Preview
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl text-xs space-y-2 border border-slate-700/60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Welcome Greeting Preview
                </div>
                {renderFormattedPreview(welcomeGreetingEdit)}
              </div>

              {pillsEdit.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Quick Action Chips
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {pillsEdit.map((pill) => (
                      <span
                        key={pill.id}
                        className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[11px]"
                      >
                        {pill.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTERACTIVE CHATBOT SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[580px] overflow-hidden">
            {/* Simulator Header */}
            <div className="p-4 bg-linear-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{chatbotAiSettings.botName} (Test Simulator)</h4>
                  <p className="text-[10px] text-blue-200">
                    Live Evaluation • Trained Q&amp;A vs Gemini Model Fallback
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSimMessages([
                    {
                      id: 'sim-welcome',
                      sender: 'bot',
                      text: chatbotAiSettings.welcomeGreeting,
                      timestamp: 'Just now',
                    },
                  ])
                }
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {simMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <p className="text-xs">{msg.text}</p>
                    ) : (
                      <div className="space-y-2">
                        {renderFormattedPreview(msg.text)}

                        {/* Action button if attached */}
                        {msg.action && (
                          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2">
                            <span className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>{msg.action.label}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Metadata / Match Badge for Bot Replies */}
                  {msg.sender === 'bot' && msg.matchType && (
                    <div className="flex items-center gap-1.5 mt-1 ml-1 text-[10px] text-slate-500 font-mono">
                      {msg.matchType === 'trained_kb' && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Matched Trained Q&amp;A (Score: {msg.matchScore}%)</span>
                        </span>
                      )}
                      {msg.matchType === 'order_id' && (
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold flex items-center gap-1">
                          <Package className="w-3 h-3 text-blue-600" />
                          <span>Direct Order ID Lookup</span>
                        </span>
                      )}
                      {msg.matchType === 'gemini_ai' && (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Gemini Generative AI</span>
                        </span>
                      )}
                      {msg.matchType === 'fallback' && (
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold">
                          Store Rule Fallback
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isSimTyping && (
                <div className="flex items-center gap-1.5 bg-white p-3 rounded-xl border border-slate-200 w-32 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] font-bold text-slate-500 ml-1">Evaluating...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSimulateSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="Type customer question or Order ID (e.g. JE-2026-000113)..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!simInput.trim() || isSimTyping}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>

          {/* Quick Test Chips & Insights */}
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>One-Click Test Queries</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Click any chip to immediately simulate how the chatbot answers customer prompts:
              </p>

              <div className="flex flex-col gap-2">
                {[
                  'Can you help me track my recent order?',
                  orders[0]?.id ? `Order status for ${orders[0].id}` : 'Order status for JE-2026-000113',
                  'What is JE Assured warranty and quality guarantee?',
                  'How fast is express delivery to Nalasopara?',
                  'Where is your store located and what are opening hours?',
                  'Do you accept cash on delivery (COD)?',
                  'What is your return and exchange policy?',
                  'Can I get a B2B GST tax invoice for business purchase?',
                ].map((sampleQuery, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSimulateSubmit(undefined, sampleQuery)}
                    className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-xs text-slate-800 font-medium transition-colors cursor-pointer flex items-center justify-between group"
                  >
                    <span className="line-clamp-1">{sampleQuery}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2 text-xs">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" />
                <span>How the Chatbot Engine Works</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                1. <strong>Direct Order Matching:</strong> Checks pattern <code>JE-XXXX-XXXXXX</code> against live orders first.<br />
                2. <strong>Instant Q&amp;A Scoring:</strong> Searches keywords and questions in your Knowledge Base. If score &gt; 20, replies in &lt;50ms.<br />
                3. <strong>Gemini 2.5 Flash Fallback:</strong> If enabled, calls generative AI with your complete knowledge base as ground truth.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT KNOWLEDGE ITEM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingItemId ? 'Edit Training Q&A' : 'Add New Training Q&A'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKnowledgeItem} className="space-y-4 text-xs">
              {/* Question */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Customer Question / Primary Trigger Phrase *
                </label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. How do I track my order?"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Keywords / Trigger tags */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Alternate Keywords &amp; Query Matches (comma-separated):
                </label>
                <input
                  type="text"
                  value={formKeywords}
                  onChange={(e) => setFormKeywords(e.target.value)}
                  placeholder="e.g. track, order status, shipment, where is my order"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  Whenever a customer message contains any of these words, this answer is evaluated.
                </span>
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ChatbotKnowledgeCategory)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none"
                  >
                    {Object.entries(categoryConfig).map(([k, c]) => (
                      <option key={k} value={k}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">Priority (1 - 10):</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400">Higher priority matches first.</span>
                </div>
              </div>

              {/* Answer */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Answer Body *</label>
                <textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Enter the comprehensive response text..."
                  required
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400">
                  Formatting tip: Use <code>**bold text**</code> and <code>• bullet items</code> for clean presentation.
                </span>
              </div>

              {/* Suggested Action Button Toggle */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Attach Interactive Quick Action Button
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Renders a clickable button directly under the chatbot response.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAction}
                    onChange={(e) => setEnableAction(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {enableAction && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Button Label *
                      </label>
                      <input
                        type="text"
                        value={actionLabel}
                        onChange={(e) => setActionLabel(e.target.value)}
                        placeholder="e.g. Open Order Tracking"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">
                        Action Type
                      </label>
                      <select
                        value={actionType}
                        onChange={(e) => {
                          const val = e.target.value as ChatbotKnowledgeAction['actionType'];
                          setActionType(val);
                          if (val === 'order_tracking') setActionIcon('package');
                          else if (val === 'pincode_check') setActionIcon('truck');
                          else if (val === 'whatsapp') setActionIcon('whatsapp');
                          else setActionIcon('link');
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="order_tracking">Track Order (Road Route)</option>
                        <option value="pincode_check">Check Delivery Pincode</option>
                        <option value="whatsapp">Open WhatsApp Chat</option>
                        <option value="promotional_page">Promotional Landing Page</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    Enable this Q&amp;A for customer inquiries
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold cursor-pointer shadow-xs"
                >
                  {editingItemId ? 'Update Q&A' : 'Save Q&A Pair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
