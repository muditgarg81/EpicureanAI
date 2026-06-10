// NOTE: @capacitor/camera is required for the camera feature on native.
// Install it with: npm install @capacitor/camera
// @capacitor-community/speech-recognition is already installed.

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import { cleanIngredientName } from '../data/culinaryData';

// ─── Utility: detect Capacitor native environment ───────────────────────────
const isNative = () =>
  typeof window !== 'undefined' &&
  window.Capacitor !== undefined &&
  window.Capacitor.isNative;

// ─── Toast Component ─────────────────────────────────────────────────────────
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] bg-on-surface text-surface px-5 py-3 rounded-2xl shadow-xl
                 font-label-md text-label-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
      {message}
    </div>
  );
};

// ─── Utility: resolve pantry item level ──────────────────────────────────────
const getItemLevel = (item) => {
  if (item.level !== undefined && item.level !== null) return Number(item.level);
  const status = item.status?.toLowerCase();
  if (status === 'out of stock') return 0;
  if (status === 'low') return 25;
  if (status === 'optimal') return 60;
  if (status === 'stocked' || status === 'fresh') return 100;
  return 100;
};

// ─── Low Stock Banner ─────────────────────────────────────────────────────────
const LowStockBanner = ({ pantryItems, addGroceryItem }) => {
  const lowItems = pantryItems.filter(
    (item) => {
      const level = getItemLevel(item);
      const status = item.status?.toLowerCase();
      return level < 30 || status === 'out of stock' || status === 'low';
    }
  );

  const [added, setAdded] = useState({});

  if (lowItems.length === 0) return null;

  const handleAdd = (item) => {
    const cleanName = cleanIngredientName(item.name) || item.name;
    addGroceryItem({ name: cleanName, quantity: item.quantity || '1 unit' });
    setAdded((prev) => ({ ...prev, [item.id]: true }));
  };

  return (
    <div className="w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto mb-4 px-2">
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">⚠️</span>
          <span className="font-label-lg text-amber-800 font-semibold">
            {lowItems.length} item{lowItems.length > 1 ? 's' : ''} running low — Add to shopping list
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {lowItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 bg-white border border-amber-200 rounded-full px-3 py-1.5 shadow-sm"
            >
              <span className="font-label-sm text-amber-900 text-sm">{item.name}</span>
              {added[item.id] ? (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Added
                </span>
              ) : (
                <button
                  onClick={() => handleAdd(item)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  Add to list
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Camera Modal ─────────────────────────────────────────────────────────────
const CameraModal = ({ onClose, addPantryItem, showToast }) => {
  const [step, setStep] = useState('scanning'); // 'scanning' | 'confirm' | 'error'
  const [detectedItems, setDetectedItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const pickImageFromFilePicker = () =>
    new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target.result;
          const base64 = result.split(',')[1];
          resolve({ base64, mimeType: file.type || 'image/jpeg' });
        };
        reader.readAsDataURL(file);
      };
      input.click();
    });

  const takePhotoAndScan = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      let base64ImageData = '';
      let mimeType = 'image/jpeg';

      if (isNative()) {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const photo = await Camera.getPhoto({
          quality: 80,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });
        base64ImageData = photo.base64String;
        if (photo.format) mimeType = `image/${photo.format}`;
      } else {
        // Web fallback: use file input to pick an image
        const imgObj = await pickImageFromFilePicker();
        base64ImageData = imgObj?.base64 || '';
        if (imgObj?.mimeType) mimeType = imgObj.mimeType;
      }

      if (!base64ImageData) {
        setErrorMsg('No image captured. Please try again.');
        setStep('error');
        return;
      }

      // Call Gemini Vision
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'List all food ingredients and pantry items you can see in this image. Return ONLY a comma-separated list of item names, nothing else. Example: chicken breast, tomatoes, olive oil, garlic',
                  },
                  { inlineData: { mimeType, data: base64ImageData } },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) throw new Error(`API error ${response.status}`);
      const data = await response.json();
      const itemsText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = itemsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (parsed.length === 0) {
        setErrorMsg('No pantry items detected. Try a clearer photo.');
        setStep('error');
        return;
      }

      setDetectedItems(parsed);
      const initialChecked = {};
      parsed.forEach((_, i) => { initialChecked[i] = true; });
      setCheckedItems(initialChecked);
      setStep('confirm');
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.message?.includes('permission')
          ? 'Camera permission denied. Please allow camera access.'
          : `Failed to scan: ${err.message}`
      );
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-trigger on mount
  useEffect(() => {
    takePhotoAndScan();
  }, [takePhotoAndScan]);

  // Old pickImageFromFilePicker was moved above

  const handleConfirmAdd = () => {
    const toAdd = detectedItems.filter((_, i) => checkedItems[i]);
    toAdd.forEach((name) => {
      addPantryItem({ name, quantity: 'Detected', status: 'Stocked', level: 80, category: 'Others' });
    });
    showToast(`Added ${toAdd.length} item${toAdd.length !== 1 ? 's' : ''} to pantry`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">photo_camera</span>
            <h3 className="font-headline-md text-on-surface">Scan Pantry</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Step: Scanning / Loading */}
        {(step === 'scanning' || isLoading) && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-4xl text-primary">photo_camera</span>
            </div>
            <p className="font-body-md text-on-surface-variant text-center">
              {isNative() ? 'Opening camera…' : 'Opening image picker…'}
            </p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && !isLoading && (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-error">error</span>
            </div>
            <p className="font-body-md text-on-surface-variant text-center">{errorMsg}</p>
            <div className="flex gap-3 w-full mt-2">
              <button onClick={onClose} className="flex-1 py-3 text-on-surface-variant hover:bg-surface-container rounded-full transition-all font-label-md">
                Cancel
              </button>
              <button onClick={takePhotoAndScan} className="flex-1 py-3 bg-primary text-on-primary rounded-full font-label-md shadow-md hover:opacity-90 transition-opacity">
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && !isLoading && (
          <>
            <p className="font-body-md text-on-surface-variant mb-4">
              Found <span className="font-semibold text-on-surface">{detectedItems.length} items</span> — confirm to add to pantry:
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-5">
              {detectedItems.map((name, i) => (
                <label key={i} className="flex items-center gap-3 p-3 bg-surface-container rounded-xl cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="checkbox"
                    checked={!!checkedItems[i]}
                    onChange={(e) => setCheckedItems((prev) => ({ ...prev, [i]: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                  <span className="font-label-md text-on-surface capitalize">{name}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-all font-label-md">
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={!Object.values(checkedItems).some(Boolean)}
                className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-label-md shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
              >
                Add to Pantry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


// ─── Main PantryInventory Page ────────────────────────────────────────────────
const PantryInventory = () => {
  const navigate = useNavigate();
  const { pantryItems, deletePantryItem, addPantryItem, updatePantryItem, addGroceryItem, groceryList } = useAppStore();

  // ── UI state ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const setHealthModalOpen = useAppStore(state => state.setHealthModalOpen);
  const healthGoals = useAppStore(state => state.healthGoals);
  const [editingItem, setEditingItem] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [activeOrderItem, setActiveOrderItem] = useState(null);

  const cleanedGroceryList = useMemo(() => {
    return (groceryList || []).map(item => ({
      ...item,
      name: cleanIngredientName(item.name) || item.name
    }));
  }, [groceryList]);

  const uncheckedItems = useMemo(() => cleanedGroceryList.filter(item => !item.checked), [cleanedGroceryList]);

  const deliveryApps = [
    {
      name: 'BigBasket',
      logo: '/bigbasket.png',
      bgColor: 'bg-green-600/10 hover:bg-green-600/20 text-green-700 dark:text-green-400 border border-green-600/30',
      searchUrl: (query) => `https://www.bigbasket.com/ps/?q=${query}`
    },
    {
      name: 'Blinkit',
      logo: '/blinkit.png',
      bgColor: 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-700 dark:text-amber-400 border border-amber-400/30',
      searchUrl: (query) => `https://blinkit.com/s/?q=${query}`
    },
    {
      name: 'Zepto',
      logo: '/zepto.png',
      bgColor: 'bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-400 border border-purple-600/30',
      searchUrl: (query) => `https://zeptonow.com/search?query=${query}`
    },
    {
      name: 'Instamart',
      logo: '/instamart.png',
      bgColor: 'bg-orange-600/10 hover:bg-orange-600/20 text-orange-700 dark:text-orange-400 border border-orange-600/30',
      searchUrl: (query) => `https://www.swiggy.com/instamart/search?query=${query}`
    }
  ];

  const handleOrderAppClick = (app) => {
    const itemToOrder = activeOrderItem || (uncheckedItems.length > 0 ? uncheckedItems[0] : null);
    if (!itemToOrder) return;
    const encoded = encodeURIComponent(itemToOrder.name);
    const url = app.searchUrl(encoded);
    
    import('@capacitor/browser').then(({ Browser }) => {
      Browser.open({ url, presentationStyle: 'popover' });
    }).catch(err => {
      console.error('Failed to open Capacitor browser, falling back to window.open', err);
      window.open(url, '_blank');
    });
  };



  // ── Add/Edit form ──
  const [formData, setFormData] = useState({
    name: '',
    category: 'Spices',
    quantity: '',
    status: 'Optimal',
    level: 100,
  });

  const showToast = useCallback((msg) => setToast(msg), []);

  // ─── Filtering ───
  const filteredItems = pantryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory || (filterCategory === 'Others' && !['Spices', 'Grains', 'Fresh'].includes(item.category));
    return matchesSearch && matchesCategory;
  });

  const spices = filteredItems.filter((item) => item.category === 'Spices');
  const grains = filteredItems.filter((item) => item.category === 'Grains');
  const fresh = filteredItems.filter((item) => item.category === 'Fresh');
  const other = filteredItems.filter((item) => !['Spices', 'Grains', 'Fresh'].includes(item.category));

  // ─── Modal handlers ───
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'Spices', quantity: '', status: 'Optimal', level: 100 });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: '',
      category: 'Spices',
      quantity: '',
      status: 'Optimal',
      level: getItemLevel(item),
      ...item,
      level: item.level !== undefined ? item.level : getItemLevel(item)
    });
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updatePantryItem(editingItem.id, formData);
    } else {
      addPantryItem({ ...formData, color: 'bg-primary' });
    }
    setIsAddModalOpen(false);
  };

  // ─── Task 3: Voice Input ───
  const recognitionRef = useRef(null);

  const handleVoiceInput = async () => {
    if (isListening) return;
    setIsListening(true);

    try {
      let transcript = '';

      if (isNative()) {
        // Capacitor native
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        await SpeechRecognition.requestPermissions();
        const result = await SpeechRecognition.start({ language: 'en-US', maxResults: 1, popup: false });
        transcript = result?.matches?.[0] || '';
      } else {
        // Web: webkitSpeechRecognition
        transcript = await new Promise((resolve, reject) => {
          const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRec) { reject(new Error('SpeechRecognition not supported')); return; }
          const recognition = new SpeechRec();
          recognitionRef.current = recognition;
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.onresult = (e) => resolve(e.results[0][0].transcript);
          recognition.onerror = (e) => reject(new Error(e.error));
          recognition.onend = () => resolve('');
          recognition.start();
        });
      }

      if (!transcript.trim()) {
        showToast('No speech detected');
        return;
      }

      // Parse: split by 'and', 'comma', or actual commas
      const names = transcript
        .split(/,|\band\b/i)
        .map((s) => s.trim())
        .filter(Boolean);

      names.forEach((name) => {
        addPantryItem({ name, quantity: '1 unit', status: 'Stocked', level: 80, category: 'Others' });
      });

      showToast(`Added: ${names.join(', ')}`);
    } catch (err) {
      console.error('Voice error:', err);
      showToast(err.message?.includes('not supported') ? 'Voice not supported on this browser' : 'Voice input failed');
    } finally {
      setIsListening(false);
    }
  };

  // Status color helper
  const statusColor = (status) => {
    const s = status?.toLowerCase();
    if (s === 'out of stock') return 'text-error';
    if (s === 'low') return 'text-amber-600';
    if (s === 'fresh' || s === 'stocked' || s === 'optimal') return 'text-secondary';
    return 'text-on-surface-variant';
  };

  const levelBarColor = (level, color) => {
    if (level <= 30) return 'bg-error';
    if (level <= 60) return 'bg-amber-400';
    return 'bg-secondary';
  };

  const hasCalorieGoal = healthGoals.calories && String(healthGoals.calories).trim() !== '';

  return (
    <main className="w-full mx-auto px-4 pb-32 mt-16 overflow-y-auto overflow-x-hidden flex flex-col items-center">
      {/* ── Toast ── */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* ── Camera Modal ── */}
      {isCameraModalOpen && (
        <CameraModal
          onClose={() => setIsCameraModalOpen(false)}
          addPantryItem={addPantryItem}
          showToast={showToast}
        />
      )}



      {/* ── Header ── */}
      <section className="mb-6 mt-8 px-2 w-full max-w-lg md:max-w-4xl lg:max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display-lg text-2xl sm:text-3xl text-on-background mb-1">Pantry Inventory</h1>
            <p className="font-body-md text-sm text-on-surface-variant">
              Smart pantry management at a glance.
            </p>
            <div className="bg-gradient-to-r from-primary-container to-tertiary-container text-on-surface px-4 py-2.5 rounded-xl inline-flex items-center gap-3 mt-4 border border-outline-variant shadow-md">
              <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
              <span className="font-label-lg text-label-lg font-bold">Tip: Press the cart icon to instantly order items on BigBasket, Blinkit, Zepto, or Instamart.</span>
            </div>
            {/* Health goal chip */}
            {hasCalorieGoal && (
              <button
                onClick={() => setHealthModalOpen(true)}
                className="inline-flex items-center gap-1.5 mt-2 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold px-3 py-1 rounded-full hover:bg-red-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                Goal: {healthGoals.calories} kcal
              </button>
            )}
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {/* Camera */}
            <button
              onClick={() => setIsCameraModalOpen(true)}
              title="Scan pantry with camera"
              className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-on-primary">photo_camera</span>
            </button>

            {/* Health */}
            <button
              onClick={() => setHealthModalOpen(true)}
              title="Health & Nutrition goals"
              className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm group"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant group-hover:text-white" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            </button>

            {/* Desktop add */}
            <button
              onClick={handleOpenAdd}
              className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary rounded-full font-label-md text-sm shadow-md hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Item
            </button>
          </div>
        </div>
      </section>

      {/* ── Task 1: Low Stock Banner ── */}
      <LowStockBanner pantryItems={pantryItems} addGroceryItem={addGroceryItem} />

      {/* ── Bento Grid ── */}
      <div className="flex flex-col gap-6 w-full px-2 max-w-lg md:max-w-4xl lg:max-w-5xl">

        {/* Pantry Management Section */}
        <div className="w-full overflow-hidden">
          {/* Search + Filter bar + Voice */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
            <div className="flex bg-surface-container-high p-1 rounded-full overflow-x-auto no-scrollbar border border-outline-variant/20 flex-shrink-0">
              {['All', 'Spices', 'Grains', 'Fresh', 'Others'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-full font-label-md text-[11px] whitespace-nowrap transition-all duration-200 ${
                    filterCategory === cat
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-1">
              {/* Search */}
              <div className="relative group flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] transition-colors group-focus-within:text-primary">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search pantry…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-full border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-md text-sm"
                />
              </div>

              {/* Task 3: Voice Input Button */}
              <button
                onClick={handleVoiceInput}
                disabled={isListening}
                title="Add items by voice"
                className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm transition-all flex-shrink-0 ${
                  isListening
                    ? 'bg-error text-on-primary animate-pulse'
                    : 'bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isListening ? 'mic' : 'mic_none'}
                </span>
              </button>
            </div>
          </div>

          {/* Pantry Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Spices */}
            {(filterCategory === 'All' || filterCategory === 'Spices') && (
              <div className="bg-surface-container-low rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-tertiary">temp_preferences_custom</span>
                  <h4 className="font-headline-md text-on-surface">Spices</h4>
                  <span className="ml-auto text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{spices.length}</span>
                </div>
                <ul className="space-y-2">
                  {spices.length === 0 && (
                    <li className="text-center py-4 text-on-surface-variant text-sm">No spices found</li>
                  )}
                  {spices.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => handleOpenEdit(item)}
                      className="flex justify-between items-center bg-surface-bright p-3 rounded-xl group/item cursor-pointer hover:bg-surface-container transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-on-surface truncate">{item.name}</span>
                        <span className={`font-label-sm text-[11px] ${statusColor(item.status)}`}>
                          {item.quantity} • {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="w-12 h-1.5 bg-outline-variant rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`${levelBarColor(getItemLevel(item), item.color)} h-full transition-all`}
                            style={{ width: `${Math.min(getItemLevel(item), 100)}%` }}
                          />
                        </div>
                        <div className="flex gap-1 opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOrderItem(item);
                              setIsDeliveryModalOpen(true);
                            }}
                            className="p-1 hover:bg-secondary/10 rounded text-secondary"
                            title={`Order ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            className="p-1 hover:bg-surface-container rounded text-outline"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePantryItem(item.id);
                            }}
                            className="p-1 hover:bg-error-container/20 rounded text-error"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Grains */}
            {(filterCategory === 'All' || filterCategory === 'Grains') && (
              <div className="bg-surface-container-low rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">grain</span>
                  <h4 className="font-headline-md text-on-surface">Grains</h4>
                  <span className="ml-auto text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{grains.length}</span>
                </div>
                <ul className="space-y-2">
                  {grains.length === 0 && (
                    <li className="text-center py-4 text-on-surface-variant text-sm">No grains found</li>
                  )}
                  {grains.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => handleOpenEdit(item)}
                      className="flex justify-between items-center bg-surface-bright p-3 rounded-xl group/item cursor-pointer hover:bg-surface-container transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-on-surface truncate">{item.name}</span>
                        <span className={`font-label-sm text-[11px] ${statusColor(item.status)}`}>
                          {item.quantity} • {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="w-12 h-1.5 bg-outline-variant rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`${levelBarColor(getItemLevel(item), item.color)} h-full transition-all`}
                            style={{ width: `${Math.min(getItemLevel(item), 100)}%` }}
                          />
                        </div>
                        {item.checked && (
                          <span className="material-symbols-outlined text-secondary text-[20px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        )}
                        <div className="flex gap-1 opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOrderItem(item);
                              setIsDeliveryModalOpen(true);
                            }}
                            className="p-1 hover:bg-secondary/10 rounded text-secondary"
                            title={`Order ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            className="p-1 hover:bg-surface-container rounded text-outline"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePantryItem(item.id);
                            }}
                            className="p-1 hover:bg-error-container/20 rounded text-error"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fresh */}
            {(filterCategory === 'All' || filterCategory === 'Fresh') && (
              <div className="bg-surface-container-low rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-secondary">eco</span>
                  <h4 className="font-headline-md text-on-surface">Fresh</h4>
                  <span className="ml-auto text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{fresh.length}</span>
                </div>
                <ul className="space-y-2">
                  {fresh.length === 0 && (
                    <li className="text-center py-4 text-on-surface-variant text-sm">No fresh items found</li>
                  )}
                  {fresh.map((item) => (
                    <li
                      key={item.id}
                      onClick={() => handleOpenEdit(item)}
                      className="flex justify-between items-center bg-surface-bright p-3 rounded-xl group/item cursor-pointer hover:bg-surface-container transition-colors"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-on-surface truncate">{item.name}</span>
                        <span className={`font-label-sm text-[11px] ${statusColor(item.status)}`}>
                          {item.quantity} • {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="w-12 h-1.5 bg-outline-variant rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`${levelBarColor(getItemLevel(item), item.color)} h-full transition-all`}
                            style={{ width: `${Math.min(getItemLevel(item), 100)}%` }}
                          />
                        </div>
                        <div className="flex gap-1 opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveOrderItem(item);
                              setIsDeliveryModalOpen(true);
                            }}
                            className="p-1 hover:bg-secondary/10 rounded text-secondary"
                            title={`Order ${item.name}`}
                          >
                            <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(item);
                            }}
                            className="p-1 hover:bg-surface-container rounded text-outline"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePantryItem(item.id);
                            }}
                            className="p-1 hover:bg-error-container/20 rounded text-error"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Other category (from camera/voice) */}
          {(filterCategory === 'All' || filterCategory === 'Others') && other.length > 0 && (
            <div className="bg-surface-container-low rounded-2xl p-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-on-surface-variant">category</span>
                <h4 className="font-headline-md text-on-surface">Others</h4>
                <span className="ml-auto text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{other.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {other.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center gap-2 bg-surface-bright px-3 py-2 rounded-xl group/item relative cursor-pointer hover:bg-surface-container transition-colors"
                  >
                    <span className="font-label-md text-on-surface text-sm">{item.name}</span>
                    <div className="w-10 h-1.5 bg-outline-variant rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className={`${levelBarColor(getItemLevel(item), item.color)} h-full transition-all`}
                        style={{ width: `${Math.min(getItemLevel(item), 100)}%` }}
                      />
                    </div>
                    <span className={`font-label-sm text-[10px] ${statusColor(item.status)}`}>{item.status}</span>
                    <div className="flex gap-1 opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOrderItem(item);
                          setIsDeliveryModalOpen(true);
                        }}
                        className="p-0.5 hover:bg-secondary/10 rounded text-secondary"
                        title={`Order ${item.name}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">shopping_cart</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="p-0.5 hover:bg-surface-container rounded text-outline"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePantryItem(item.id);
                        }}
                        className="p-0.5 hover:bg-error-container/20 rounded text-error"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Pantry Suggestions CTA */}
        <div className="w-full">
          <div className="glass-card rounded-3xl p-6 border border-surface-container-highest flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline-md text-on-surface">Cook with what you have</h3>
              <p className="font-body-md text-sm text-on-surface-variant">Let AI suggest recipes using your current pantry.</p>
            </div>
            <button
              onClick={() =>
                navigate('/generator', {
                  state: { pantryItems: pantryItems.map((p) => ({ name: p.name, checked: true })) },
                })
              }
              className="flex-shrink-0 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label-md text-sm hover:opacity-90 transition-opacity"
            >
              Generate
            </button>
          </div>
        </div>
      </div>

      {/* ── Add/Edit Modal ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-surface w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="font-headline-lg text-on-surface mb-6">
              {editingItem ? 'Update Item' : 'Add to Pantry'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="font-label-md text-on-surface-variant text-sm">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Smoked Paprika"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-label-md text-on-surface-variant text-sm">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      let newStatus = formData.status;
                      if (formData.level > 75) {
                        newStatus = newCat === 'Fresh' ? 'Fresh' : 'Stocked';
                      } else if (formData.level <= 30 && formData.level > 0) {
                        newStatus = 'Low';
                      } else if (formData.level === 0) {
                        newStatus = 'Out of Stock';
                      } else {
                        newStatus = 'Optimal';
                      }
                      setFormData({
                        ...formData,
                        category: newCat,
                        status: newStatus
                      });
                    }}
                    className="w-full bg-surface-container px-4 py-3.5 rounded-2xl outline-none"
                  >
                    <option>Spices</option>
                    <option>Grains</option>
                    <option>Fresh</option>
                    <option value="Others">Other Essentials</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-label-md text-on-surface-variant text-sm">Quantity</label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full bg-surface-container px-4 py-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g., 50g left"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-label-md text-on-surface-variant text-sm">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      let newLevel = formData.level;
                      if (newStatus === 'Out of Stock') {
                        newLevel = 0;
                      } else if (newStatus === 'Low') {
                        if (newLevel <= 0 || newLevel > 30) newLevel = 25;
                      } else if (newStatus === 'Optimal') {
                        if (newLevel <= 30 || newLevel > 75) newLevel = 60;
                      } else if (newStatus === 'Stocked' || newStatus === 'Fresh') {
                        if (newLevel <= 75) newLevel = 100;
                      }
                      const isChecked = newStatus !== 'Out of Stock';
                      setFormData({
                        ...formData,
                        status: newStatus,
                        level: newLevel,
                        checked: isChecked
                      });
                    }}
                    className="w-full bg-surface-container px-4 py-3.5 rounded-2xl outline-none"
                  >
                    <option>Stocked</option>
                    <option>Optimal</option>
                    <option>Low</option>
                    <option>Out of Stock</option>
                    <option>Fresh</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-label-md text-on-surface-variant text-sm">Level ({formData.level}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={formData.level}
                    onChange={(e) => {
                      const newLevel = Number(e.target.value);
                      let newStatus = formData.status;
                      if (newLevel === 0) {
                        newStatus = 'Out of Stock';
                      } else if (newLevel <= 30) {
                        newStatus = 'Low';
                      } else if (newLevel <= 75) {
                        newStatus = 'Optimal';
                      } else {
                        newStatus = formData.category === 'Fresh' ? 'Fresh' : 'Stocked';
                      }
                      const isChecked = newStatus !== 'Out of Stock';
                      setFormData({
                        ...formData,
                        level: newLevel,
                        status: newStatus,
                        checked: isChecked
                      });
                    }}
                    className="w-full mt-3 accent-[var(--color-primary)]"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3.5 font-label-lg text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-label-lg shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  {editingItem ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FAB (Mobile) ── */}
      <div className="fixed bottom-24 right-6 z-50 md:hidden flex flex-col items-end gap-3">
        <button
          onClick={handleOpenAdd}
          className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>

      <AnimatePresence>
        {isDeliveryModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-surface-container-high p-6 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 border border-outline-variant/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">shopping_cart</span>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Order via...</h3>
                </div>
                <button 
                  onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Description */}
              <p className="font-body-md text-sm text-on-surface-variant mb-5">
                {activeOrderItem ? (
                  <>Select an app to search for: <strong className="text-on-surface">"{activeOrderItem.name}"</strong></>
                ) : (
                  <>Select an app to search for your first item: <strong className="text-on-surface">"{uncheckedItems[0]?.name}"</strong></>
                )}
              </p>

              {/* Grid of Apps */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {deliveryApps.map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleOrderAppClick(app)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 active:scale-95 ${app.bgColor}`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-2 bg-white rounded-xl p-2 shadow-sm border border-outline-variant/10">
                      <img src={app.logo} alt={`${app.name} logo`} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-label-lg text-sm font-semibold">{app.name}</span>
                  </button>
                ))}
              </div>

              {/* Reference list */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-[150px]">
                <h4 className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs mb-2">
                  Items to Order ({uncheckedItems.length})
                </h4>
                <div className="flex-1 overflow-y-auto bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 custom-scrollbar">
                  <ul className="space-y-1.5">
                    {uncheckedItems.map((item, idx) => (
                      <li key={item.id} className="font-body-md text-sm text-on-surface flex items-start gap-2">
                        <span className="text-on-surface-variant font-bold text-xs mt-0.5">{idx + 1}.</span>
                        <span>{item.name} {item.quantity ? <span className="text-on-surface-variant text-xs">({item.quantity})</span> : ''}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action */}
              <div className="flex gap-4 pt-6 mt-2 border-t border-outline-variant/30">
                <button 
                  onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
                  className="w-full py-3 bg-primary text-on-primary font-label-lg rounded-2xl hover:shadow-lg transition-all"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default PantryInventory;
