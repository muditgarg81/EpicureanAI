import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import useTranslation from '../hooks/useTranslation';

const HelpCenter = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeFaq, setActiveFaq] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactType, setContactType] = useState('email');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset active FAQ when category or search changes
  useEffect(() => {
    setActiveFaq(null);
  }, [activeCategory, searchQuery]);

  const categories = [
    { id: 'All', name: 'All Topics', icon: 'grid_view' },
    { id: 'AI', name: 'AI Coach', icon: 'psychology' },
    { id: 'Recipes', name: 'Recipes', icon: 'restaurant_menu' },
    { id: 'Billing', name: 'Billing', icon: 'payments' },
    { id: 'Pantry', name: 'Pantry', icon: 'inventory_2' },
    { id: 'Family', name: 'Family & Hub', icon: 'family_restroom' }
  ];

  const faqs = [
    { id: 1, category: 'AI', question: "Can I use the AI Coach offline?", answer: "Currently, the AI Coach requires an internet connection to process complex culinary queries. However, you can save recipes to your offline 'Cookbook' for access later." },
    { id: 2, category: 'AI', question: "How do I trigger voice commands?", answer: "Simply tap the microphone icon in the bottom navigation bar or say 'Hey Epicurean' while the app is active and in 'Hands-Free' mode." },
    { id: 3, category: 'AI', question: "Can the AI Coach adjust for my specific skill level?", answer: "Yes! Your 'Mastery Profile' tracks your progress. You can manually adjust your skill level in Settings > Mastery to get more advanced or beginner-friendly techniques." },
    { id: 4, category: 'Recipes', question: "How do I share my shopping list with others?", answer: "Navigate to the 'Kitchen Hub', create a Family group, and select 'Invite Member'. The shopping list is automatically synced across all family devices." },
    { id: 5, category: 'Recipes', question: "Does the recipe generator support dietary restrictions?", answer: "Absolutely. The AI filters ingredients and suggests safe alternatives based on your 'Kitchen Hub' preferences or the prompt you provide." },
    { id: 6, category: 'Recipes', question: "How do I save a generated recipe permanently?", answer: "Tap the 'Heart' icon or the 'Save to Cookbook' button on any recipe card. You can then find it in your Mastery Profile under 'Saved Gems'." },
    { id: 7, category: 'Recipes', question: "Can I scale recipes for more people?", answer: "Yes, use the 'Portion Control' slider on the Recipe Details page. The AI will dynamically recalculate the ingredient quantities for you." },
    { 
      id: 8, 
      category: 'Billing', 
      question: "How do I cancel my subscription?", 
      answer: <span>Go to Account Settings &gt; Billing &gt; Manage Subscription. You'll retain premium access until the end of the current billing cycle. For details on subscription rules, please review our <Link to="/refund" className="text-primary hover:underline font-bold">Refund Policy</Link> or visit the <Link to="/legal" className="text-primary hover:underline font-bold">Legal Desk</Link>.</span>,
      searchText: "Go to Account Settings > Billing > Manage Subscription. You'll retain premium access until the end of the current billing cycle. For details on subscription rules, please review our Refund Policy or visit the Legal Desk."
    },
    { 
      id: 9, 
      category: 'Billing', 
      question: "Is there a free trial for the Chef Plan?", 
      answer: <span>New users receive a 7-day trial of the Chef Plan upon account creation, providing full access to unlimited AI generations and voice coaching. Subscriptions can be managed via settings and are subject to our <Link to="/refund" className="text-primary hover:underline font-bold">Refund Policy</Link> and <Link to="/terms" className="text-primary hover:underline font-bold">Terms & Conditions</Link>.</span>,
      searchText: "New users receive a 7-day trial of the Chef Plan upon account creation, providing full access to unlimited AI generations and voice coaching. Subscriptions can be managed via settings and are subject to our Refund Policy and Terms & Conditions."
    },
    { id: 10, category: 'Billing', question: "Do you offer family plan pricing?", answer: "Yes! Our 'Kitchen Dynasty' plan allows up to 6 family members to share a single subscription while maintaining individual mastery profiles." },
    { id: 11, category: 'Pantry', question: "How does the 'Smart Pantry' alert system work?", answer: "When you add items to your Pantry, you can set an expiry date. The app will send you a push notification 2 days before the item expires with recipe suggestions to use it." },
    { id: 12, category: 'Pantry', question: "Can I scan receipts to add items?", answer: "Yes! In the Flavor Profile Pantry, tap the '+' button and select 'Scan Receipt'. Our AI will parse the items and add them to your inventory automatically." },
    { id: 13, category: 'Family', question: "How do I merge two family kitchens?", answer: "Currently, you can only belong to one Kitchen Hub at a time. To merge, one family must join the other via an invite link. All shared data will be consolidated." },
    { id: 14, category: 'Family', question: "Can I restrict what my children see in the app?", answer: "Yes, by assigning the 'Child' role in the Kitchen Hub, users will only see kid-friendly recipes and simplified cooking instructions." },
    { id: 15, category: 'AI', question: "What is the 'Culinary Memory' feature?", answer: "It allows the AI to remember your previous conversations. If you mentioned you hate cilantro yesterday, it will avoid cilantro in all future suggestions until you change your preference." },
    { id: 16, category: 'AI', question: "How accurate is the AI flavor pairing?", answer: "Our AI uses a database of over 100,000 professional flavor pairings and molecular gastronomy data to suggest combinations that are scientifically proven to taste great." },
    { id: 17, category: 'Recipes', question: "Can I upload my own recipes?", answer: "Yes, in the Mastery Profile, you can tap 'Create Recipe' to manually enter your own family secrets and have the AI Coach help you optimize them." },
    { 
      id: 18, 
      category: 'Billing', 
      question: "What payment methods are accepted?", 
      answer: <span>We accept all major credit cards, Apple Pay, Google Pay, UPI, and net banking (processed securely via Razorpay). For complete payment safety terms, view our <Link to="/privacy" className="text-primary hover:underline font-bold">Privacy Policy</Link> and <Link to="/terms" className="text-primary hover:underline font-bold">Terms & Conditions</Link>.</span>,
      searchText: "We accept all major credit cards, Apple Pay, Google Pay, UPI, and net banking (processed securely via Razorpay). For complete payment safety terms, view our Privacy Policy and Terms & Conditions."
    },
    { id: 19, category: 'Pantry', question: "Can the app track liquid inventory?", answer: "Yes, when adding items like milk or oil, you can specify volume in Liters or Ounces. The AI Coach will alert you when you're running low based on your planned recipes." },
    { id: 20, category: 'Family', question: "Is my family data private?", answer: "Absolutely. All family hub data is encrypted and only accessible by members you explicitly invite. We never share your private meal plans with third parties." }
  ];

  // Global search behavior: if user types, we should search all categories
  useEffect(() => {
    if (searchQuery.trim().length > 0 && activeCategory !== 'All') {
      setActiveCategory('All');
    }
  }, [searchQuery]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return faqs.filter(faq => {
      const matchesSearch = query === '' || 
                           faq.question.toLowerCase().includes(query) || 
                           (typeof faq.answer === 'string' ? faq.answer : (faq.searchText || '')).toLowerCase().includes(query);
      
      // When searching, we ignore the category to provide global results
      // Otherwise, we respect the active category
      const matchesCategory = searchQuery.trim() !== '' || 
                              activeCategory === 'All' || 
                              faq.category === activeCategory;
                              
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsContactModalOpen(false);
    }, 2500);
  };

  const scrollToFaqs = () => {
    const faqSection = document.getElementById('faq-results-section');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    setSearchQuery('');
    setTimeout(scrollToFaqs, 100); // Small delay to allow state update
  };

  const handlePopularTagClick = (tag) => {
    setSearchQuery(tag);
    setActiveCategory('All');
    setTimeout(scrollToFaqs, 100);
  };
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      scrollToFaqs();
    }
  };

  const handleSuggestionClick = (question) => {
    setSearchQuery(question);
    setShowSuggestions(false);
    scrollToFaqs();
  };

  return (
    <div className="min-h-screen font-body-md text-body-md bg-background text-on-surface">
      <main className="pt-24 pb-32 px-container-margin max-w-7xl mx-auto">
        {/* Hero Search Section */}
        <section className="mb-xl text-center py-lg">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display-lg text-display-lg text-on-surface mb-md"
          >
            {t('how_help')}
          </motion.h2>
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full pl-12 pr-6 py-4 rounded-full bg-surface-container-low border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary transition-all text-body-lg font-body-lg shadow-sm outline-none" 
              placeholder={t('search_placeholder')} 
              type="text" 
            />
            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && filteredFaqs.length > 0 && searchQuery.trim().length > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant rounded-3xl shadow-2xl z-[100] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {filteredFaqs.slice(0, 5).map((faq) => (
                    <button 
                      key={faq.id}
                      onClick={() => handleSuggestionClick(faq.question)}
                      className="w-full px-6 py-4 text-left hover:bg-primary/10 transition-colors flex items-center gap-3 group"
                    >
                      <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-sm flex-shrink-0">help_outline</span>
                      <span className="text-body-md text-on-surface truncate">{faq.question}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-sm flex justify-center gap-4 flex-wrap">
            <span className="text-label-sm font-label-sm text-on-surface-variant">{t('popular')}:</span>
            {['Reset Password', 'AI Coach', 'Billing', 'Pantry'].map(tag => (
              <button 
                key={tag}
                onClick={() => handlePopularTagClick(tag)}
                className="text-label-sm font-label-sm text-primary hover:underline transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Categories Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-xl">
          {/* AI Coach Help (Large) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => handleCategorySelect('AI')}
            className={`md:col-span-8 group relative overflow-hidden rounded-[2.5rem] p-md h-80 flex flex-col justify-end shadow-sm hover:shadow-xl transition-all border cursor-pointer ${activeCategory === 'AI' ? 'border-primary ring-2 ring-primary ring-inset' : 'border-primary/10'}`}
          >
            <div className="absolute top-0 right-0 p-md opacity-20 group-hover:opacity-40 transition-opacity">
              <span className="material-symbols-outlined !text-8xl">psychology</span>
            </div>
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-label-sm mb-sm shadow-sm">
                <span className="material-symbols-outlined !text-sm">auto_awesome</span>
                AI Powered
              </span>
              <h3 className="font-headline-lg text-headline-lg text-on-primary-container mb-xs">AI Coach Help</h3>
              <p className="text-body-md font-body-md text-on-surface-variant max-w-md mb-md">Master the art of conversational cooking and get the most out of your digital sous-chef.</p>
              <button className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-md text-label-md hover:shadow-lg active:scale-95 transition-all">Explore Guide</button>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-transparent to-primary-container/40"></div>
          </motion.div>

          {/* Recipe Generator Tips */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => handleCategorySelect('Recipes')}
            className={`md:col-span-4 group relative overflow-hidden rounded-[2.5rem] p-md h-80 flex flex-col shadow-sm hover:shadow-xl transition-all border cursor-pointer ${activeCategory === 'Recipes' ? 'border-secondary ring-2 ring-secondary ring-inset' : 'border-secondary/10'}`}
          >
            <div className="mb-auto">
              <div className="w-14 h-14 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center mb-sm shadow-md">
                <span className="material-symbols-outlined !text-3xl">restaurant_menu</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-secondary-container mb-xs">Recipe Generator</h3>
              <p className="text-body-md font-body-md text-on-surface-variant">Adjusting portions, swapping ingredients, and saving favorites.</p>
            </div>
            <div className="flex items-center gap-2 text-secondary font-label-lg text-label-lg group-hover:gap-3 transition-all">
              View 12 articles <span className="material-symbols-outlined !text-sm">arrow_forward</span>
            </div>
          </motion.div>

          {/* Subscription & Billing */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => handleCategorySelect('Billing')}
            className={`md:col-span-4 group relative overflow-hidden rounded-[2.5rem] p-md h-64 flex flex-col shadow-sm hover:shadow-xl transition-all border cursor-pointer ${activeCategory === 'Billing' ? 'border-primary ring-2 ring-primary ring-inset' : 'border-outline-variant/30'}`}
          >
            <div className="mb-auto">
              <div className="w-14 h-14 rounded-2xl bg-inverse-surface text-inverse-on-surface flex items-center justify-center mb-sm shadow-md">
                <span className="material-symbols-outlined !text-3xl">payments</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Billing</h3>
              <p className="text-body-md font-body-md text-on-surface-variant">Manage your premium plan and update payment methods.</p>
            </div>
            <div className="flex items-center gap-2 text-primary font-label-lg text-label-lg">
              Manage Account <span className="material-symbols-outlined !text-sm">open_in_new</span>
            </div>
          </motion.div>

          {/* Pantry Management (Medium) */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            onClick={() => handleCategorySelect('Pantry')}
            className={`md:col-span-8 group relative overflow-hidden rounded-[2.5rem] p-md h-64 flex flex-col md:flex-row gap-md shadow-sm hover:shadow-xl transition-all border cursor-pointer ${activeCategory === 'Pantry' ? 'border-primary ring-2 ring-primary ring-inset' : 'border-outline-variant/30'}`}
          >
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-xs">Pantry Management</h3>
              <p className="text-body-md font-body-md text-on-surface-variant mb-md">Keep track of your ingredients and reduce food waste with smart inventory tools.</p>
              <div className="flex gap-4">
                <span className="text-label-md font-label-md text-primary hover:underline">Scanning items</span>
                <span className="text-label-md font-label-md text-primary hover:underline">Expiry alerts</span>
              </div>
            </div>
            <div className="flex-1 h-full rounded-2xl overflow-hidden relative shadow-inner">
              <img 
                alt="Pantry organization" 
                className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwyNPkjRy0d0CGmXKzWDGJs7mfvYnnpAugMYcib-scyWwm0lFF5YZjG0CFfCv8EAg9dFPCzASF0vGYKX1ouRyAMUod_QHpRcUUvwMy_5qBtAAEGgcXUsOdzN4dwu5wohMJCsddbpga6_l8khiyID2m7BfyawKTRLs7Yk6-9NwDgdT73uVtOJGJIUbluB2pC_BK112Bgah-QzPEaefD2e3EFBud41hi17xj8nsnQ9BC8LByY6KI9x_olbH_aMGw_H4mcqHvHqlsG4Y"
              />
            </div>
          </motion.div>
        </section>

        {/* Navigation Categories Tabs */}
        <section className="mb-lg overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-label-lg transition-all ${activeCategory === cat.id ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container hover:bg-surface-container-high'}`}
              >
                <span className="material-symbols-outlined !text-xl">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* FAQ Results */}
        <section id="faq-results-section" className="mb-xl min-h-[400px] scroll-mt-28">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {activeCategory === 'All' ? 'Frequently Asked Questions' : `${categories.find(c => c.id === activeCategory)?.name} FAQs`}
            </h2>
            <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="text-primary font-label-md text-label-md hover:underline">Reset Filters</button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredFaqs.length > 0 ? (
                <motion.div 
                  key={activeCategory + searchQuery}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {filteredFaqs.map((faq) => (
                    <div 
                      key={faq.id}
                      className="bg-surface-container rounded-[1.5rem] overflow-hidden border border-outline-variant/30 transition-all hover:border-primary/50"
                    >
                      <button 
                        onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                        className="w-full p-6 flex items-center justify-between text-left group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className={`material-symbols-outlined transition-colors ${activeFaq === faq.id ? 'text-primary' : 'text-outline'}`}>
                            {activeFaq === faq.id ? 'help' : 'help_outline'}
                          </span>
                          <p className="font-headline-sm text-headline-sm text-on-surface">{faq.question}</p>
                        </div>
                        <motion.span 
                          animate={{ rotate: activeFaq === faq.id ? 180 : 0 }}
                          className="material-symbols-outlined text-outline"
                        >
                          expand_more
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {activeFaq === faq.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-6 pt-0 text-on-surface-variant font-body-lg border-t border-outline-variant/10 mt-2 bg-surface/30">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 bg-surface-container-lowest rounded-3xl border border-dashed border-outline-variant"
                >
                  <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
                  <p className="text-on-surface-variant font-body-lg">No matches found for your current filters.</p>
                  <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-4 text-primary font-label-lg underline">Clear All Filters</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Still need help? Card */}
        <section className="bg-surface-container-high rounded-[2.5rem] p-lg md:p-xl border border-primary/10 text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="font-display-md text-display-md text-on-surface mb-sm">Still can't find what you're looking for?</h2>
            <p className="text-body-lg font-body-lg text-on-surface-variant mb-lg max-w-2xl mx-auto">Our support team is available 24/7 to assist you with any questions about your culinary journey.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => { setContactType('email'); setIsContactModalOpen(true); }}
                className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-label-lg text-label-lg flex items-center justify-center gap-3 hover:shadow-xl active:scale-95 transition-all shadow-md"
              >
                <span className="material-symbols-outlined">mail</span>
                Email Support
              </button>
              <button 
                onClick={() => { setContactType('callback'); setIsContactModalOpen(true); }}
                className="bg-surface border border-outline text-on-surface px-10 py-4 rounded-2xl font-label-lg text-label-lg flex items-center justify-center gap-3 hover:bg-surface-container-highest active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined">call</span>
                Request Callback
              </button>
            </div>
          </div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px]"></div>
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-secondary/10 rounded-full blur-[100px]"></div>
        </section>
      </main>

      {/* Floating Live Chat Action */}
      <button 
        onClick={() => { setContactType('chat'); setIsContactModalOpen(true); }}
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 w-20 h-20 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-all group overflow-hidden"
      >
        <motion.div 
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative z-10"
        >
          <span className="material-symbols-outlined !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary via-primary-container/30 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </button>

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-surface-container-high p-8 rounded-[3rem] shadow-2xl border border-outline-variant/30"
            >
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-surface-variant/20 flex items-center justify-center hover:bg-surface-variant/40 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined !text-4xl text-primary">
                    {contactType === 'email' ? 'mail' : contactType === 'chat' ? 'forum' : 'call'}
                  </span>
                </div>
                <h3 className="font-display-sm text-display-sm">
                  {contactType === 'email' ? 'Send an Email' : contactType === 'chat' ? 'Live Chat' : 'Request Callback'}
                </h3>
                <p className="text-on-surface-variant mt-2">
                  {contactType === 'chat' ? "We'll connect you with a specialist in seconds." : "We'll get back to you within 2 hours."}
                </p>
              </div>

              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-on-primary !text-3xl">check</span>
                  </div>
                  <h4 className="font-headline-md text-headline-md mb-2">Request Received!</h4>
                  <p className="text-on-surface-variant">Our culinary support team is on it.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-label-md font-label-md pl-1">Subject</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all" 
                      placeholder="What do you need help with?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-label-md font-label-md pl-1">Message</label>
                    <textarea 
                      required
                      rows="4"
                      className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all resize-none" 
                      placeholder="Describe your issue in detail..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-primary text-on-primary font-label-lg rounded-2xl hover:shadow-xl active:scale-[0.98] transition-all mt-4"
                  >
                    Submit Request
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpCenter;
