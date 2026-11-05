import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  CategoryItem,
  SubCategoryItem,
  CategoryCommissionStructure,
  ProductCategory,
} from '../../types';
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  Upload,
  Percent,
  IndianRupee,
  Tag,
  Smartphone,
  Headphones,
  Zap,
  Watch,
  Tv,
  Laptop,
  Home,
  Coffee,
  Shirt,
  Sparkles,
  UserCheck,
  Heart,
  Smile,
  ShoppingBag,
  Package,
  LayoutGrid,
  Maximize2,
  Link2,
} from 'lucide-react';

const ICON_OPTIONS = [
  { name: 'Smartphone', label: 'Mobile', icon: Smartphone },
  { name: 'Headphones', label: 'Audio', icon: Headphones },
  { name: 'Zap', label: 'Power', icon: Zap },
  { name: 'Watch', label: 'Watch', icon: Watch },
  { name: 'Tv', label: 'TV / Media', icon: Tv },
  { name: 'Laptop', label: 'Computer', icon: Laptop },
  { name: 'Home', label: 'Home', icon: Home },
  { name: 'Coffee', label: 'Appliance', icon: Coffee },
  { name: 'Shirt', label: 'Clothing', icon: Shirt },
  { name: 'Sparkles', label: 'Cosmetics', icon: Sparkles },
  { name: 'UserCheck', label: "Men's", icon: UserCheck },
  { name: 'Heart', label: "Women's", icon: Heart },
  { name: 'Smile', label: "Kids'", icon: Smile },
  { name: 'ShoppingBag', label: 'Shopping', icon: ShoppingBag },
  { name: 'Package', label: 'Package', icon: Package },
  { name: 'Tag', label: 'Tag', icon: Tag },
  { name: 'Layers', label: 'General', icon: Layers },
];

export const renderCategoryIconByName = (iconName?: string, className = 'w-5 h-5') => {
  const found = ICON_OPTIONS.find(
    (opt) => opt.name.toLowerCase() === (iconName || '').toLowerCase()
  );
  const IconComp = found ? found.icon : LayoutGrid;
  return <IconComp className={className} />;
};

export const CategoryMasterManager: React.FC = () => {
  const {
    categories,
    products,
    addCategory,
    updateCategory,
    deleteCategory,
    addSubCategory,
    updateSubCategory,
    deleteSubCategory,
    setFullScreenCategory,
    setSelectedCategory,
  } = useStore();

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Add / Edit Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState<ProductCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIconName, setCatIconName] = useState('Smartphone');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [commType, setCommType] = useState<'percentage' | 'fixed' | 'hybrid'>('percentage');
  const [commPercent, setCommPercent] = useState<number>(8);
  const [commFixedFee, setCommFixedFee] = useState<number>(15);
  const [commGstRate, setCommGstRate] = useState<number>(18);
  const [draftSubCategories, setDraftSubCategories] = useState<SubCategoryItem[]>([]);

  // Inline Subcategory Draft inside Category Modal
  const [newSubName, setNewSubName] = useState('');
  const [newSubImageUrl, setNewSubImageUrl] = useState('');
  const [newSubIconName, setNewSubIconName] = useState('Tag');
  const [newSubCommPercent, setNewSubCommPercent] = useState<string>('');
  const [editingDraftSubId, setEditingDraftSubId] = useState<string | null>(null);

  // Dedicated Subcategory Linker Modal for an existing Category
  const [subModalCategory, setSubModalCategory] = useState<CategoryItem | null>(null);
  const [subNameInput, setSubNameInput] = useState('');
  const [subImageInput, setSubImageInput] = useState('');
  const [subIconInput, setSubIconInput] = useState('Tag');
  const [subCommInput, setSubCommInput] = useState<string>('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const handleFileUploadToDataUrl = (
    e: React.ChangeEvent<HTMLInputElement>,
    onResult: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onResult(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openCreateCategoryModal = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDescription('');
    setCatIconName('Layers');
    setCatImageUrl('');
    setCommType('percentage');
    setCommPercent(8.0);
    setCommFixedFee(15);
    setCommGstRate(18);
    setDraftSubCategories([]);
    setNewSubName('');
    setNewSubImageUrl('');
    setNewSubIconName('Tag');
    setNewSubCommPercent('');
    setEditingDraftSubId(null);
    setShowCatModal(true);
  };

  const openEditCategoryModal = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCatIconName(cat.iconName || 'Layers');
    setCatImageUrl(cat.imageUrl || '');
    setCommType(cat.commissionStructure?.type || 'percentage');
    setCommPercent(cat.commissionStructure?.commissionPercent ?? 8.0);
    setCommFixedFee(cat.commissionStructure?.fixedFee ?? 15);
    setCommGstRate(cat.commissionStructure?.gstRate ?? 18);
    setDraftSubCategories(cat.subCategories ? [...cat.subCategories] : []);
    setNewSubName('');
    setNewSubImageUrl('');
    setNewSubIconName('Tag');
    setNewSubCommPercent('');
    setEditingDraftSubId(null);
    setShowCatModal(true);
  };

  const handleAddOrUpdateDraftSub = () => {
    const clean = newSubName.trim();
    if (!clean) return;

    const parsedComm = newSubCommPercent.trim() !== '' ? Number(newSubCommPercent) : undefined;

    if (editingDraftSubId) {
      setDraftSubCategories((prev) =>
        prev.map((s) =>
          s.id === editingDraftSubId
            ? {
                ...s,
                name: clean,
                imageUrl: newSubImageUrl.trim() || undefined,
                iconName: newSubIconName,
                commissionPercent: parsedComm,
              }
            : s
        )
      );
      setEditingDraftSubId(null);
    } else {
      const subId = `sub_${clean
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')}_${Date.now().toString().slice(-4)}`;
      setDraftSubCategories((prev) => [
        ...prev,
        {
          id: subId,
          name: clean,
          parentCategoryId: editingCatId || 'other',
          imageUrl: newSubImageUrl.trim() || undefined,
          iconName: newSubIconName,
          commissionPercent: parsedComm,
        },
      ]);
    }
    setNewSubName('');
    setNewSubImageUrl('');
    setNewSubIconName('Tag');
    setNewSubCommPercent('');
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = catName.trim();
    if (!cleanName) return;

    const commissionStructure: CategoryCommissionStructure = {
      type: commType,
      commissionPercent: Number(commPercent) || 0,
      fixedFee: Number(commFixedFee) || 0,
      gstRate: Number(commGstRate) || 18,
    };

    if (editingCatId) {
      const res = updateCategory(editingCatId, {
        name: cleanName,
        description: catDescription.trim() || `${cleanName} products`,
        iconName: catIconName,
        imageUrl: catImageUrl.trim() || undefined,
        commissionStructure,
        subCategories: draftSubCategories.map((sc) => ({
          ...sc,
          parentCategoryId: editingCatId,
        })),
      });
      showToast(res.message);
    } else {
      const res = addCategory({
        name: cleanName,
        description: catDescription.trim() || `${cleanName} products`,
        iconName: catIconName,
        imageUrl: catImageUrl.trim() || undefined,
        defaultGstRate: commissionStructure.gstRate,
        commissionStructure,
        subCategories: draftSubCategories,
      });
      showToast(res.message);
    }
    setShowCatModal(false);
  };

  const handleDeleteCategory = (cat: CategoryItem) => {
    const res = deleteCategory(cat.id);
    showToast(res.message);
  };

  // Dedicated Subcategory Modal Handlers
  const openSubCategoryModal = (cat: CategoryItem) => {
    setSubModalCategory(cat);
    setSubNameInput('');
    setSubImageInput('');
    setSubIconInput(cat.iconName || 'Tag');
    setSubCommInput('');
    setEditingSubId(null);
  };

  const handleSaveSubCategoryInModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subModalCategory) return;
    const clean = subNameInput.trim();
    if (!clean) return;

    const parsedComm = subCommInput.trim() !== '' ? Number(subCommInput) : undefined;

    if (editingSubId) {
      updateSubCategory(subModalCategory.id, editingSubId, {
        name: clean,
        imageUrl: subImageInput.trim() || undefined,
        iconName: subIconInput,
        commissionPercent: parsedComm,
      });
      showToast(`Subcategory "${clean}" updated.`);
    } else {
      addSubCategory(subModalCategory.id, {
        name: clean,
        imageUrl: subImageInput.trim() || undefined,
        iconName: subIconInput,
        commissionPercent: parsedComm,
      });
      showToast(`Subcategory "${clean}" linked to ${subModalCategory.name}.`);
    }

    setSubNameInput('');
    setSubImageInput('');
    setSubCommInput('');
    setEditingSubId(null);
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const matchCat = c.name.toLowerCase().includes(q);
    const matchSub = (c.subCategories || []).some((s) => s.name.toLowerCase().includes(q));
    return matchCat || matchSub;
  });

  // Refresh subModalCategory reference from live categories state
  const liveSubModalCategory = subModalCategory
    ? categories.find((c) => c.id === subModalCategory.id) || null
    : null;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between text-xs font-bold animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900">
              Categories &amp; Subcategories ({categories.length})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Commission &amp; Media Enabled
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, or delete categories, configure commission structure, upload category/subcategory images or icons, and link subcategories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search category or subcategory..."
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 min-w-[210px]"
          />
          <button
            type="button"
            onClick={openCreateCategoryModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Category</span>
          </button>
        </div>
      </div>

      {/* All Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const catProductsCount = products.filter((p) => p.categoryId === cat.id).length;
          const subCats = cat.subCategories || [];
          const comm = cat.commissionStructure || {
            type: 'percentage',
            commissionPercent: 8,
            fixedFee: 15,
            gstRate: 18,
          };

          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Category Banner / Image + Icon Header */}
                <div className="relative h-32 bg-slate-100 overflow-hidden border-b border-slate-100">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 via-slate-100 to-blue-500/10 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                        {renderCategoryIconByName(cat.iconName, 'w-7 h-7')}
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-xs text-slate-900 text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs">
                      <span className="text-indigo-600">
                        {renderCategoryIconByName(cat.iconName, 'w-3.5 h-3.5')}
                      </span>
                      <span>{cat.iconName}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-bold">
                      {catProductsCount} Items
                    </span>
                  </div>

                  {/* Category Name & Fullscreen Preview Button */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-white leading-tight drop-shadow-xs">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-slate-200 line-clamp-1">
                        {cat.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setFullScreenCategory(cat.id);
                      }}
                      title="Open Full-Screen Category Storefront View"
                      className="shrink-0 p-1.5 rounded-lg bg-white/20 hover:bg-white/35 text-white backdrop-blur-xs cursor-pointer transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Commission Structure Strip */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Percent className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Commission:</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-[11px]">
                      {comm.type === 'fixed'
                        ? `₹${comm.fixedFee} Fixed`
                        : comm.type === 'hybrid'
                        ? `${comm.commissionPercent}% + ₹${comm.fixedFee}`
                        : `${comm.commissionPercent}%`}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                      GST {comm.gstRate}%
                    </span>
                  </div>
                </div>

                {/* Linked Subcategories Section */}
                <div className="p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                      Linked Subcategories ({subCats.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => openSubCategoryModal(cat)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Link / Edit Sub</span>
                    </button>
                  </div>

                  {subCats.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {subCats.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => openSubCategoryModal(cat)}
                          className="group flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                        >
                          {sub.imageUrl ? (
                            <img
                              src={sub.imageUrl}
                              alt={sub.name}
                              className="w-5 h-5 rounded-md object-cover shrink-0 bg-white"
                            />
                          ) : (
                            <span className="w-5 h-5 rounded-md bg-white flex items-center justify-center text-indigo-600 shrink-0">
                              {renderCategoryIconByName(sub.iconName || cat.iconName, 'w-3 h-3')}
                            </span>
                          )}
                          <span className="truncate max-w-[130px]">{sub.name}</span>
                          {sub.commissionPercent !== undefined && (
                            <span className="text-[10px] font-bold text-indigo-600">
                              ({sub.commissionPercent}%)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-3 px-3 rounded-xl border border-dashed border-slate-200 text-center">
                      <p className="text-[11px] text-slate-400 font-medium">
                        No subcategories linked yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions: Edit / Link Subcategory / Delete */}
              <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditCategoryModal(cat)}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openSubCategoryModal(cat)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Subcategories</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCategory(cat)}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  {renderCategoryIconByName(catIconName, 'w-5 h-5 text-white')}
                </div>
                <div>
                  <h3 className="text-base font-black">
                    {editingCatId ? `Edit Category: ${catName}` : 'Add New Category'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Configure Category Name, Image/Icon, Commission Structure &amp; Linked Subcategories
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveCategory} className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* 1. Basic Category Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g., Television & Home Audio"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    value={catDescription}
                    onChange={(e) => setCatDescription(e.target.value)}
                    placeholder="Brief description shown in category header"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* 2. Category Image Upload / URL & Icon Picker */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                    Category Image &amp; Icon
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600">
                      Category Image URL or Upload Image
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={catImageUrl}
                        onChange={(e) => setCatImageUrl(e.target.value)}
                        placeholder="https://... or upload image file"
                        className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                      <label className="shrink-0 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUploadToDataUrl(e, setCatImageUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="flex items-center gap-3 justify-center sm:justify-end">
                    <div className="w-20 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center relative shadow-2xs">
                      {catImageUrl ? (
                        <>
                          <img
                            src={catImageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setCatImageUrl('')}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/75 text-white hover:bg-rose-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="text-indigo-600 flex flex-col items-center">
                          {renderCategoryIconByName(catIconName, 'w-6 h-6')}
                          <span className="text-[9px] text-slate-400 font-bold mt-0.5">Icon Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Icon Selector Grid */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Select Category Icon
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-9 gap-1.5">
                    {ICON_OPTIONS.map((opt) => {
                      const IconComp = opt.icon;
                      const selected = catIconName === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setCatIconName(opt.name)}
                          className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span className="text-[9px] font-bold truncate w-full">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Commission Structure Configuration */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4 text-indigo-600" />
                    Category Commission Structure
                  </span>
                  <span className="text-[11px] font-bold text-indigo-700">
                    Applied to seller &amp; store settlements
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Structure Type
                    </label>
                    <select
                      value={commType}
                      onChange={(e) => setCommType(e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Fee (₹)</option>
                      <option value="hybrid">Hybrid (% + ₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Commission (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={commPercent}
                      onChange={(e) => setCommPercent( Number(e.target.value) )}
                      disabled={commType === 'fixed'}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Fixed Platform Fee (₹)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={commFixedFee}
                      onChange={(e) => setCommFixedFee(Number(e.target.value))}
                      disabled={commType === 'percentage'}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Default GST Rate (%)
                    </label>
                    <select
                      value={commGstRate}
                      onChange={(e) => setCommGstRate(Number(e.target.value))}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value={0}>0% GST</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                      <option value={28}>28% GST</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Link Subcategories with Subcategory Image */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-indigo-600" />
                    Linked Subcategories ({draftSubCategories.length})
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Add subcategory name, image &amp; optional commission override
                  </span>
                </div>

                {/* Add / Edit Subcategory Row */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white p-3 rounded-xl border border-slate-200">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Subcategory Name
                    </label>
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      placeholder="e.g., 4K QLED TV"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Subcategory Image (URL or Upload)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newSubImageUrl}
                        onChange={(e) => setNewSubImageUrl(e.target.value)}
                        placeholder="Image URL..."
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg min-w-0"
                      />
                      <label className="shrink-0 p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUploadToDataUrl(e, setNewSubImageUrl)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">
                      Comm % (Opt)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newSubCommPercent}
                      onChange={(e) => setNewSubCommPercent(e.target.value)}
                      placeholder={`${commPercent}%`}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddOrUpdateDraftSub}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{editingDraftSubId ? 'Update' : 'Add'}</span>
                    </button>
                  </div>
                </div>

                {/* Draft Subcategories List */}
                {draftSubCategories.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {draftSubCategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {sub.imageUrl ? (
                            <img
                              src={sub.imageUrl}
                              alt={sub.name}
                              className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              {renderCategoryIconByName(sub.iconName || catIconName, 'w-4 h-4')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{sub.name}</p>
                            <p className="text-[10px] text-slate-500">
                              {sub.commissionPercent !== undefined
                                ? `Custom Comm: ${sub.commissionPercent}%`
                                : `Default Cat Comm (${commPercent}%)`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDraftSubId(sub.id);
                              setNewSubName(sub.name);
                              setNewSubImageUrl(sub.imageUrl || '');
                              setNewSubIconName(sub.iconName || 'Tag');
                              setNewSubCommPercent(
                                sub.commissionPercent !== undefined
                                  ? String(sub.commissionPercent)
                                  : ''
                              );
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDraftSubCategories((prev) => prev.filter((s) => s.id !== sub.id))
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCatId ? 'Save Category Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED LINK / MANAGE SUBCATEGORIES MODAL */}
      {liveSubModalCategory && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {liveSubModalCategory.imageUrl ? (
                  <img
                    src={liveSubModalCategory.imageUrl}
                    alt={liveSubModalCategory.name}
                    className="w-9 h-9 rounded-xl object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                    {renderCategoryIconByName(liveSubModalCategory.iconName, 'w-5 h-5 text-white')}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-black">
                    Subcategories for {liveSubModalCategory.name}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Link subcategories, upload subcategory images &amp; set commission
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubModalCategory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Add / Edit Subcategory Form */}
              <form
                onSubmit={handleSaveSubCategoryInModal}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="text-xs font-extrabold text-slate-800">
                  {editingSubId ? 'Edit Subcategory' : '+ Link New Subcategory'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Subcategory Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={subNameInput}
                      onChange={(e) => setSubNameInput(e.target.value)}
                      placeholder="e.g., Smart Android TV"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Commission % (Optional Override)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={subCommInput}
                      onChange={(e) => setSubCommInput(e.target.value)}
                      placeholder={`Default (${liveSubModalCategory.commissionStructure?.commissionPercent ?? 8}%)`}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Subcategory Image (URL or File Upload)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={subImageInput}
                      onChange={(e) => setSubImageInput(e.target.value)}
                      placeholder="Paste image URL or upload file..."
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                    <label className="shrink-0 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUploadToDataUrl(e, setSubImageInput)}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  {editingSubId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubId(null);
                        setSubNameInput('');
                        setSubImageInput('');
                        setSubCommInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 bg-white cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingSubId ? 'Update Subcategory' : 'Link Subcategory'}</span>
                  </button>
                </div>
              </form>

              {/* Existing Linked Subcategories List */}
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-700">
                  Linked Subcategories ({(liveSubModalCategory.subCategories || []).length})
                </div>

                {(liveSubModalCategory.subCategories || []).length > 0 ? (
                  <div className="space-y-2">
                    {(liveSubModalCategory.subCategories || []).map((sub) => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-200 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {sub.imageUrl ? (
                            <img
                              src={sub.imageUrl}
                              alt={sub.name}
                              className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                              {renderCategoryIconByName(
                                sub.iconName || liveSubModalCategory.iconName,
                                'w-5 h-5'
                              )}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-extrabold text-slate-900 truncate">
                              {sub.name}
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              Commission:{' '}
                              <span className="font-bold text-indigo-700">
                                {sub.commissionPercent !== undefined
                                  ? `${sub.commissionPercent}%`
                                  : `${liveSubModalCategory.commissionStructure?.commissionPercent ?? 8}% (Category Default)`}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubId(sub.id);
                              setSubNameInput(sub.name);
                              setSubImageInput(sub.imageUrl || '');
                              setSubIconInput(sub.iconName || 'Tag');
                              setSubCommInput(
                                sub.commissionPercent !== undefined
                                  ? String(sub.commissionPercent)
                                  : ''
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteSubCategory(liveSubModalCategory.id, sub.id);
                              showToast(`Subcategory "${sub.name}" removed.`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                    No subcategories linked to {liveSubModalCategory.name} yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
