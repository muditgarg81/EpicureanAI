import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../store/useAppStore';
import { cleanIngredientName } from '../data/culinaryData';

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

const FlavorProfilePantry = () => {
  const navigate = useNavigate();
  const { pantryItems, deletePantryItem, addPantryItem, updatePantryItem, groceryList } = useAppStore();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);
  const [filterCategory, setFilterCategory] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = React.useState(false);
  const [activeOrderItem, setActiveOrderItem] = React.useState(null);

  const cleanedGroceryList = React.useMemo(() => {
    return (groceryList || []).map(item => ({
      ...item,
      name: cleanIngredientName(item.name) || item.name
    }));
  }, [groceryList]);

  const uncheckedItems = React.useMemo(() => cleanedGroceryList.filter(item => !item.checked), [cleanedGroceryList]);

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
      bgColor: 'bg-[#F8CB46]/10 hover:bg-[#F8CB46]/20 text-[#D8A71F] border border-[#F8CB46]/30',
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

  const [formData, setFormData] = React.useState({
    name: '',
    category: 'Spices',
    quantity: '',
    status: 'Optimal',
    level: 100
  });

  const filteredItems = pantryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory || (filterCategory === 'Other' && !['Spices', 'Grains', 'Fresh'].includes(item.category));
    return matchesSearch && matchesCategory;
  });

  const spices = filteredItems.filter(item => item.category === 'Spices');
  const grains = filteredItems.filter(item => item.category === 'Grains');
  const fresh = filteredItems.filter(item => item.category === 'Fresh');
  const other = filteredItems.filter(item => !['Spices', 'Grains', 'Fresh'].includes(item.category));

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'Spices', quantity: '', status: 'Optimal', level: 100 });
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updatePantryItem(editingItem.id, formData);
    } else {
      addPantryItem({ ...formData, color: 'bg-primary' });
    }
    setIsModalOpen(false);
  };

  return (
    <main className="w-full mx-auto px-4 pb-32 mt-16 overflow-y-auto overflow-x-hidden flex flex-col items-center">
      {/* Header Section */}
      <section className="mb-lg mt-8 px-2 w-full max-w-lg md:max-w-4xl lg:max-w-5xl">
        <h1 className="font-display-lg text-2xl sm:text-3xl text-on-background mb-base">Your Culinary Identity</h1>
        <p className="font-body-md text-sm sm:text-body-md text-on-surface-variant">
          Refining your palate through intelligent pantry management.
        </p>
      </section>

      {/* Bento Grid Layout */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-6 w-full px-2 max-w-lg md:max-w-4xl lg:max-w-5xl">
        {/* Culinary Map: Mastery (Bento Large) */}
        <div className="rounded-[2rem] overflow-hidden relative group h-56 sm:h-80 shadow-lg bg-surface-container w-full md:col-span-2">
          <div className="absolute inset-0 z-0">
            <img
              className="w-full h-full object-cover opacity-40"
              alt="Global Cuisines"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDOhPA1fdgarsdQY-1Rv5hjrSVjPDnPMOhWb4BbdHxWrzGmUx2GHhC6ovVR_CEON1k88lBfqJnnFDOZVMrzzqQt101uHTp6abh9P7E0Pg1wGvTi07o7lusFxtA2KJDlr0arTXCwvh-mbh6G1DWQz99Ir_tfFnWDhgK9yFbYQiDoZa9WUPpMNtTf58TiUKN8aoHZdSRn9fitYKY0229OKHrnqZvMus3e8cwymn8w2Don202S0m5d5nIf4wnWCNgG9Eqs2GAsbcCPYBI"
            />
          </div>
          <div className="relative z-10 p-md h-full flex flex-col">
            <div className="flex justify-between items-start mb-auto">
              <div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest bg-primary-container px-3 py-1 rounded-full">Global Mastery</span>
                <h2 className="font-headline-lg text-headline-lg mt-sm text-on-surface">Culinary Map</h2>
              </div>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Live Insights</span>
              </div>
            </div>
            <div className="mt-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
                {[
                  { region: 'Mediterranean', mastery: '84%' },
                  { region: 'East Asian', mastery: '62%' },
                  { region: 'South Asian', mastery: '41%' },
                  { region: 'Latin American', mastery: '15%' },
                ].map((item, i) => (
                  <div key={i} className="glass-card p-sm rounded-lg border border-white/40">
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{item.region}</p>
                    <p className="font-headline-md text-headline-md text-primary">{item.mastery}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Flavor Radar Profile (Bento Medium) */}
        <div className="rounded-3xl glass-card border border-surface-container-highest p-6 shadow-md flex flex-col justify-center items-center text-center">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-lg">Flavor Profile</h3>
          <div className="relative w-full aspect-square max-w-[240px] flex items-center justify-center">
            {/* Radar Chart SVG */}
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle className="text-outline-variant/30" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="0.5"></circle>
              <circle className="text-outline-variant/30" cx="50" cy="50" fill="none" r="30" stroke="currentColor" strokeWidth="0.5"></circle>
              <circle className="text-outline-variant/30" cx="50" cy="50" fill="none" r="15" stroke="currentColor" strokeWidth="0.5"></circle>
              {/* Radar Shape */}
              <polygon className="text-primary/20" fill="currentColor" points="50,10 85,35 75,85 25,85 15,35"></polygon>
              <polygon className="text-primary" fill="none" points="50,10 85,35 75,85 25,85 15,35" stroke="currentColor" strokeWidth="1.5"></polygon>
            </svg>
            {/* Labels */}
            <span className="absolute top-0 font-label-sm text-label-sm text-on-surface-variant">Umami</span>
            <span className="absolute right-0 top-1/3 translate-x-1/2 font-label-sm text-label-sm text-on-surface-variant">Sour</span>
            <span className="absolute bottom-0 right-4 font-label-sm text-label-sm text-on-surface-variant">Salt</span>
            <span className="absolute bottom-0 left-4 font-label-sm text-label-sm text-on-surface-variant">Bitter</span>
            <span className="absolute left-0 top-1/3 -translate-x-1/2 font-label-sm text-label-sm text-on-surface-variant">Sweet</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-lg">
            Your profile leans towards <span className="text-primary font-bold">Complex Savory</span> with high umami sensitivity.
          </p>
        </div>

        {/* AI Insight Card */}
        <div className="md:col-span-1 w-full">
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-surface-container-highest flex flex-col justify-between h-full shadow-md">
            <div className="absolute top-0 right-0 p-md opacity-5 z-0">
              <span className="material-symbols-outlined text-9xl text-primary">auto_awesome</span>
            </div>
            <div className="flex-grow flex flex-col justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-sm">
                  <span className="material-symbols-outlined text-primary">auto_awesome</span>
                  <span className="font-label-md text-label-md text-primary uppercase tracking-widest">AI Suggestion</span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-base">Expand Your Palate</h3>
                <p className="font-body-md text-sm text-on-surface-variant mb-md leading-relaxed">
                  Based on your mastered <span className="font-bold text-on-surface">Mediterranean</span> skills and pantry essentials, Genie recommends exploring new custom recipes now.
                </p>
              </div>
              <div className="flex flex-col gap-sm mt-4">
                <button
                  onClick={() => navigate('/generator', {
                    state: {
                      pantryItems: pantryItems.map(p => ({ name: p.name, checked: true }))
                    }
                  })}
                  className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity block text-center"
                >
                  View Recommended Recipes
                </button>
              </div>
            </div>
            <div className="w-full h-24 rounded-2xl overflow-hidden z-10 mt-md">
              <img
                alt="Tagine dish"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoiAva7He7yrnrUshvDdpfTVdWLb82WsqIstPF5i333JyNofZ_HHWlAEZ6r4szhrc9q_1xUxJ2epcI9svf7rG-V9hlHzGYB-aMQKkK0MT94f-P9fDtSLyr3fA7I5kC4Bf7Y5uCOG6aKKgQHU5CKRpWKHdZyQPuBej3PCh0WBPpTWFr0iEUUzBAJpq5re-4QvQBeeCwnLK6tbggo9plcFm7v3okpxBKfdxYdGm616K6YABpYkTPdu_EsnnuHUCfGRVTzaK8EmaMsQk"
              />
            </div>
          </div>
        </div>

        {/* Pantry Management (Bento Large Row) */}
        <div className="w-full overflow-hidden md:col-span-2">
          <div className="flex flex-col justify-between items-start mb-md gap-4">
            <div>
              <h2 className="font-headline-lg text-2xl text-on-surface">Digital Pantry</h2>
              <p className="font-body-md text-on-surface-variant">Intelligent inventory.</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              {/* Category Segmented Control */}
              <div className="flex bg-surface-container-high p-1 rounded-full w-full overflow-x-auto no-scrollbar border border-outline-variant/20">
                {['All', 'Spices', 'Grains', 'Fresh', 'Other'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`flex-1 px-4 py-2 rounded-full font-label-md text-[11px] whitespace-nowrap transition-all duration-300 ${
                      filterCategory === cat 
                        ? 'bg-surface text-primary shadow-sm' 
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Field */}
              <div className="relative group w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] transition-colors group-focus-within:text-primary">search</span>
                <input 
                  type="text" 
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-container rounded-full border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-md text-sm"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category: Spices */}
            {(filterCategory === 'All' || filterCategory === 'Spices') && (
              <div className="bg-surface-container-low rounded-2xl p-md">
                <div className="flex items-center gap-3 mb-md">
                  <span className="material-symbols-outlined text-tertiary">temp_preferences_custom</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface">Spices</h4>
                </div>
                <ul className="space-y-sm">
                  {spices.length === 0 && (
                    <li className="text-center py-4 text-on-surface-variant text-sm">No spices found</li>
                  )}
                  {spices.map((item) => (
                    <li key={item.id} className="flex justify-between items-center bg-surface-bright p-sm rounded-lg group/item cursor-pointer hover:bg-surface-container transition-colors" onClick={() => handleOpenEdit(item)}>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface truncate">{item.name}</span>
                        <span className={`font-label-sm text-label-sm ${statusColor(item.status)}`}>{item.quantity} • {item.status}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        <div className="w-12 h-1.5 bg-outline-variant rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className={`${levelBarColor(getItemLevel(item), item.color)} h-full transition-all`}
                            style={{ width: `${Math.min(getItemLevel(item), 100)}%` }}
                          />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
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
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }} className="p-1 hover:bg-surface-container rounded text-outline"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                          <button onClick={(e) => { e.stopPropagation(); deletePantryItem(item.id); }} className="p-1 hover:bg-error-container/20 rounded text-error"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category: Grains */}
            {(filterCategory === 'All' || filterCategory === 'Grains') && (
              <div className="bg-surface-container-low rounded-xl p-md">
                <div className="flex items-center gap-3 mb-md">
                  <span className="material-symbols-outlined text-primary">grain</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface">Grains</h4>
                </div>
                <ul className="space-y-sm">
                  {grains.length === 0 && (
                    <li className="text-center py-4 text-on-surface-variant text-sm">No grains found</li>
                  )}
                  {grains.map((item) => (
                    <li key={item.id} className="flex justify-between items-center bg-surface-bright p-sm rounded-lg group/item cursor-pointer hover:bg-surface-container transition-colors" onClick={() => handleOpenEdit(item)}>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-md text-label-md text-on-surface truncate">{item.name}</span>
                        <span className={`font-label-sm text-label-sm ${statusColor(item.status)}`}>{item.quantity} • {item.status}</span>
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
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
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

            {/* Category: Fresh */}
            {(filterCategory === 'All' || filterCategory === 'Fresh') && (
              <div className="bg-surface-container-low rounded-xl p-md">
                <div className="flex items-center gap-3 mb-md">
                  <span className="material-symbols-outlined text-secondary">eco</span>
                  <h4 className="font-headline-md text-headline-md text-on-surface">Fresh</h4>
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  {fresh.length === 0 && (
                    <p className="col-span-2 text-center py-4 text-on-surface-variant text-sm">No fresh items found</p>
                  )}
                  {fresh.map((item) => (
                    <div key={item.id} className="bg-surface-bright p-sm rounded-lg flex flex-col items-center text-center relative group/item cursor-pointer hover:bg-surface-container transition-colors" onClick={() => handleOpenEdit(item)}>
                      {item.img ? (
                        <img
                          alt={item.name}
                          className="w-12 h-12 rounded-full object-cover mb-2"
                          src={item.img}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                          <span className="material-symbols-outlined text-secondary">eco</span>
                        </div>
                      )}
                      <span className="font-label-sm text-label-sm text-on-surface">{item.name}</span>
                      <span className={`text-[10px] font-bold ${statusColor(item.status)}`}>{item.quantity}</span>
                      <div className="w-16 h-1.5 bg-outline-variant rounded-full overflow-hidden mt-2 flex-shrink-0">
                        <div
                          className={`${levelBarColor(getItemLevel(item), item.color)} h-full transition-all`}
                          style={{ width: `${Math.min(getItemLevel(item), 100)}%` }}
                        />
                      </div>
                      <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
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

            {/* Category: Other */}
            {(filterCategory === 'All' || filterCategory === 'Other') && other.length > 0 && (
              <div className="bg-surface-container-low rounded-2xl p-4 mt-4 w-full md:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-on-surface-variant">category</span>
                  <h4 className="font-headline-md text-on-surface">Other</h4>
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
                      <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
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
        </div>
      </div>
      
      {/* Premium Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-md">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-surface w-full max-w-md rounded-[32px] p-xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-xl">
              {editingItem ? 'Update Essentials' : 'Add to Pantry'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="space-y-2">
                <label className="font-label-md text-label-md text-on-surface-variant">Item Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-surface-container px-lg py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="e.g., Smoked Paprika"
                />
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Category</label>
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
                    className="w-full bg-surface-container px-lg py-4 rounded-2xl outline-none"
                  >
                    <option>Spices</option>
                    <option>Grains</option>
                    <option>Fresh</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Quantity</label>
                  <input 
                    type="text" 
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full bg-surface-container px-lg py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="e.g., 50g left"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Status</label>
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
                    className="w-full bg-surface-container px-lg py-4 rounded-2xl outline-none"
                  >
                    <option>Stocked</option>
                    <option>Optimal</option>
                    <option>Low</option>
                    <option>Out of Stock</option>
                    <option>Fresh</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">Level ({formData.level}%)</label>
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
              <div className="flex gap-md pt-base">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container rounded-full transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-primary text-on-primary rounded-full font-label-lg text-label-lg shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  {editingItem ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contextual Floating Action Button */}
      <div className="fixed bottom-24 right-container-margin z-50 md:hidden">
        <button onClick={handleOpenAdd} className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
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

              {/* Body */}
              <div className="flex-1 overflow-y-auto mb-6">
                <p className="font-body-md text-on-surface-variant mb-4">
                  {activeOrderItem 
                    ? `Select an app to search for: "${activeOrderItem.name}"`
                    : `Select an app to search for your first item: "${uncheckedItems[0]?.name || ''}"`
                  }
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {deliveryApps.map((app) => (
                    <button
                      key={app.name}
                      onClick={() => handleOrderAppClick(app)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all font-label-lg text-sm gap-2 ${app.bgColor}`}
                    >
                      <img src={app.logo} alt={app.name} className="w-12 h-12 rounded-xl object-contain shadow-sm" />
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <button
                onClick={() => { setIsDeliveryModalOpen(false); setActiveOrderItem(null); }}
                className="w-full py-3.5 bg-outline-variant/20 hover:bg-outline-variant/30 text-on-surface rounded-full font-label-md transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default FlavorProfilePantry;
