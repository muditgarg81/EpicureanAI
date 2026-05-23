import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LegalPolicies = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const policies = [
    {
      id: 'terms',
      title: "Terms & Conditions",
      icon: "gavel",
      color: "from-blue-500/10 to-indigo-500/10 text-blue-500",
      description: "Understand your rights and responsibilities when using our AI culinary coaching platform.",
      highlights: [
        "AI suggestions disclaimer regarding food allergies & hazards",
        "Subscription billing guidelines & payment terms via Razorpay",
        "User account creation & password security rules",
        "Intellectual property rules on AI-generated culinary steps"
      ],
      content: [
        "1. Acceptance of Terms: Welcome to Modern Kitchen. By creating an account or subscribing, you agree to be bound by these Terms and Conditions.",
        "2. Eligibility: You must be at least 13 years old. You are responsible for account security and passwords.",
        "3. Subscription Plans: Taste (Free), Savor Premium, and Feast Ultimate. Payments are billed on a recurring basis via Razorpay. GST is charged at 18%.",
        "4. Cancellations: Cancel anytime via settings. Access continues until the end of the billing period.",
        "5. Culinary AI Coach Disclaimer: AI-generated recipes are for inspiration only. Cooking involves risks. Users must verify food safety, freshness, and personal dietary compliance (especially food allergies).",
        "6. User-Generated Content: Invites and sharing in Family Kitchen Hub are subject to a royalty-free hosting license.",
        "7. Intellectual Property: Modern Kitchen logos, layouts, and code are proprietary.",
        "8. Limitation of Liability: Epicurean AI is not liable for cooking accidents, food poisoning, or data breaches.",
        "9. Governing Law: Subject to Delhi, India jurisdiction."
      ]
    },
    {
      id: 'privacy',
      title: "Privacy Policy",
      icon: "verified_user",
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-500",
      description: "Learn how we collect, protect, and handle your personal details and culinary preferences.",
      highlights: [
        "Complete safety of name, email, and password hashes",
        "No storage of raw credit card details (processed by Razorpay)",
        "Dietary and allergy settings kept strictly private",
        "Transient voice files deleted immediately after command execution"
      ],
      content: [
        "1. Information We Collect: Account data (email, name), culinary preferences (allergens, dietary restrictions, skill level), pantry inventories, and transient voice files used in hands-free mode.",
        "2. Payment Information: Handled securely by Razorpay. We do not store payment card information.",
        "3. Usage of Information: Personalizing recipes, sending pantry expiry notifications, syncing Family Hub data, and managing billing.",
        "4. Data Sharing: We never sell data. We share only with essential sub-processors (Supabase, Razorpay).",
        "5. Cookies & Local Storage: Used to maintain your session, active theme choice, and English language settings.",
        "6. Data Security: Encrypted in transit (SSL/TLS) and at rest.",
        "7. Your Rights: Right to access, update, or delete. Use 'Delete Account' in Settings to permanently wipe all data.",
        "8. Policy Updates: Posted in-app and notified via changing 'Last Updated' stamp.",
        "9. Privacy Officer Contact: privacy@epicurean.ai"
      ]
    },
    {
      id: 'refund',
      title: "Refund Policy",
      icon: "currency_exchange",
      color: "from-amber-500/10 to-orange-500/10 text-amber-500",
      description: "Review our policies regarding trial periods, duplicate billings, and processing timelines.",
      highlights: [
        "7-Day Free Trial refund policy for Savor and Feast plans",
        "Full refunds on verified billing errors & duplicate charges",
        "5 to 7 business days processing time back to source account",
        "Automatic downgrade to free Taste plan upon refund execution"
      ],
      content: [
        "1. 7-Day Free Trial: Available on Savor and Feast plans. Cancel before trial ends to avoid all charges.",
        "2. Monthly Plans: Non-refundable once processed. Cancellations prevent the next monthly renewal.",
        "3. Annual Plans: 7-day satisfaction refund guarantee available from date of purchase or renewal.",
        "4. Billing Errors: Dispute double billing within 30 days to obtain a full refund.",
        "5. Refund Process: Email support@epicurean.ai with account email, Razorpay payment ID, and reason.",
        "6. Refund Timelines: Refunded back to UPI, Card, Net Banking, or Wallet within 5 to 7 business days.",
        "7. Post-Refund Status: Accounts downgrade to Taste (Free). Shared Family Hubs are locked."
      ]
    }
  ];

  const handleSearchFilter = (contentArray) => {
    if (!searchQuery) return contentArray;
    return contentArray.filter(line => line.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const currentPolicy = policies.find(p => p.id === activeTab);

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md pt-24 pb-32">
      <div className="max-w-4xl mx-auto px-container-margin">
        {/* Navigation Header */}
        <header className="mb-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (activeTab !== 'overview') {
                  setActiveTab('overview');
                } else {
                  navigate(-1);
                }
              }}
              className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95 shadow-sm"
              aria-label="Go Back"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <div>
              <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">Compliance Desk</span>
              <h1 className="font-display-lg text-display-lg text-on-surface leading-tight">
                Legal & Policies
              </h1>
            </div>
          </div>

          {/* Action Tabs Selector */}
          <div className="flex items-center gap-2 p-1.5 bg-surface-container rounded-full border border-outline-variant/30 overflow-x-auto max-w-full custom-scrollbar">
            {['overview', 'terms', 'privacy', 'refund'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQuery(''); }}
                className={`px-4 py-2 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                {tab === 'overview' ? 'Hub Overview' : tab === 'terms' ? 'Terms' : tab === 'privacy' ? 'Privacy' : 'Refunds'}
              </button>
            ))}
          </div>
        </header>

        {/* Global Search Bar when viewing individual documents */}
        {activeTab !== 'overview' && (
          <div className="mb-6 relative">
            <span className="material-symbols-outlined absolute left-4 top-3 text-outline">search</span>
            <input
              type="text"
              placeholder={`Search in ${currentPolicy.title}...`}
              className="w-full bg-surface-container border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary rounded-full pl-12 pr-6 py-3 outline-none font-body-md text-on-surface transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Dynamic Content Renderer */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Intro Banner */}
              <div className="bg-surface-container-high rounded-[2.5rem] p-8 md:p-10 border border-primary/10 relative overflow-hidden shadow-sm">
                <div className="relative z-10 max-w-xl">
                  <h2 className="font-headline-lg text-on-surface mb-2">Modern Kitchen Policy Desk</h2>
                  <p className="text-on-surface-variant font-body-lg mb-6">
                    We keep our agreements transparent, simple, and safe. Explore the relevant documents below to learn about your data protection rights, cancellation rules, and subscription services.
                  </p>
                  <div className="flex gap-4 flex-wrap">
                    <button 
                      onClick={() => navigate('/help')}
                      className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-label-md hover:shadow-lg active:scale-95 transition-all shadow-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-[18px]">help</span>
                      Contact Support
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-surface border border-outline text-on-surface px-6 py-3 rounded-2xl font-label-md hover:bg-surface-container-highest active:scale-95 transition-all shadow-sm flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined !text-[18px]">print</span>
                      Print Document
                    </button>
                  </div>
                </div>
                <span className="absolute -bottom-10 -right-10 material-symbols-outlined !text-[16rem] text-primary/5 select-none pointer-events-none">gavel</span>
              </div>

              {/* Bento Grid Policy Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {policies.map(p => (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -4 }}
                    className="bg-surface-container rounded-[2rem] p-6 border border-outline-variant/30 flex flex-col justify-between shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setActiveTab(p.id)}
                  >
                    <div className="space-y-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-inner`}>
                        <span className="material-symbols-outlined !text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-headline-md text-headline-sm text-on-surface">{p.title}</h3>
                        <p className="text-on-surface-variant font-body-sm mt-1">{p.description}</p>
                      </div>
                      <ul className="space-y-2 pt-2 border-t border-outline-variant/10">
                        {p.highlights.map((h, i) => (
                          <li key={i} className="flex gap-2 items-start text-label-sm text-on-surface-variant leading-tight">
                            <span className="material-symbols-outlined !text-[14px] text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveTab(p.id); }}
                      className="w-full mt-6 bg-primary/5 hover:bg-primary/10 text-primary font-label-md py-3 rounded-xl transition-all"
                    >
                      Read Full Policy
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-surface-container rounded-[2.5rem] p-8 md:p-12 border border-outline-variant/30 shadow-sm"
            >
              <div className="flex justify-between items-start mb-8 pb-4 border-b border-outline-variant/20">
                <div>
                  <h2 className="font-headline-lg text-primary">{currentPolicy.title}</h2>
                  <p className="text-on-surface-variant font-body-md mt-1">{currentPolicy.description}</p>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-highest transition-colors active:scale-95 text-on-surface shadow-sm"
                  title="Print Policy"
                >
                  <span className="material-symbols-outlined">print</span>
                </button>
              </div>

              {/* Policy Content Lines */}
              <div className="space-y-6">
                {handleSearchFilter(currentPolicy.content).length > 0 ? (
                  handleSearchFilter(currentPolicy.content).map((paragraph, index) => {
                    const parts = paragraph.split(': ');
                    const header = parts[0];
                    const text = parts.slice(1).join(': ');

                    return (
                      <div key={index} className="space-y-2">
                        <h4 className="font-headline-sm text-on-surface font-semibold">{header}</h4>
                        <p className="text-on-surface-variant font-body-lg text-justify leading-relaxed">{text}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined !text-5xl text-outline mb-2">search_off</span>
                    <p className="font-body-lg">No paragraphs match your search term.</p>
                  </div>
                )}
              </div>

              <div className="mt-12 flex justify-between items-center pt-6 border-t border-outline-variant/20">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="text-primary font-label-md hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
                  Back to Hub
                </button>
                <span className="text-label-sm text-outline-variant">Delhi, India</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LegalPolicies;
