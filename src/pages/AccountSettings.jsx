import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import useTranslation from '../hooks/useTranslation';

const AccountSettings = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'account');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successType, setSuccessType] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const activePlan = useAppStore(state => state.activePlan);
  const setActivePlan = useAppStore(state => state.setActivePlan);

  const handleSecurityAction = (action, extraData) => {
    setSuccessType(action);
    setIsSuccess(true);
    if (action === 'subscription' && extraData) {
      setActivePlan(extraData);
    }
    setTimeout(() => {
      setIsSuccess(false);
      setSuccessType('');
      if (action === 'password') setIsPasswordModalOpen(false);
      if (action === '2fa') setIsTwoFactorModalOpen(false);
      if (action === 'delete') {
        setIsDeleteModalOpen(false);
        // Safely sign out via dynamic import or direct lookup
        import('../store/useAuthStore').then((m) => m.default.getState().deleteAccount());
      }
      if (action === 'subscription') setIsSubscriptionModalOpen(false);
    }, 2000);
  };

  return (
    <>
      <div className="min-h-screen bg-background text-on-surface font-body-md pt-24 pb-32">
        <div className="max-w-4xl mx-auto px-container-margin">
          <header className="mb-xl">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display-lg text-display-lg text-primary mb-2"
            >
              {t('account_settings')}
            </motion.h1>
            <p className="text-on-surface-variant font-body-lg">Manage your subscription and personal preferences.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <aside className="md:col-span-1 space-y-2">
              {[
                { id: 'account', label: t('overview'), icon: 'account_circle' },
                { id: 'subscription', label: t('subscription'), icon: 'payments' },
                { id: 'security', label: t('security'), icon: 'lock' },
                { id: 'legal', label: 'Legal & Policies', icon: 'gavel' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary text-on-primary shadow-lg' : 'hover:bg-surface-container'}`}
                >
                  <span className="material-symbols-outlined">{tab.icon}</span>
                  <span className="font-label-lg">{tab.label}</span>
                </button>
              ))}
            </aside>

            {/* Main Content Area */}
            <main className="md:col-span-3">
              <AnimatePresence mode="wait">
                {activeTab === 'account' && (
                  <motion.section
                    key="account"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface-container rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm"
                  >
                    <h2 className="font-headline-md mb-6">Profile Overview</h2>
                    <div className="space-y-6">
                      <div className="flex items-center gap-6 p-4 rounded-2xl bg-surface/50">
                        <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-primary font-display-md">M</div>
                        <div>
                          <h3 className="font-headline-sm">Mudit Garg</h3>
                          <p className="text-on-surface-variant">mudit@example.com</p>
                        </div>
                        <button className="ml-auto text-primary font-label-lg hover:underline">Edit</button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl border border-outline-variant/30">
                          <p className="text-label-sm text-on-surface-variant mb-1">Kitchen Role</p>
                          <p className="font-body-lg">Executive Chef</p>
                        </div>
                        <div className="p-4 rounded-2xl border border-outline-variant/30">
                          <p className="text-label-sm text-on-surface-variant mb-1">Joined Date</p>
                          <p className="font-body-lg">May 2026</p>
                        </div>
                      </div>
                    </div>
                  </motion.section>
                )}

                {activeTab === 'subscription' && (
                  <motion.section
                    key="subscription"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface-container rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="font-headline-md">Your Subscription</h2>
                      <span className="bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-label-sm shadow-sm">Active Plan</span>
                    </div>

                    <div className="bg-gradient-to-br from-primary to-primary-container p-8 rounded-3xl text-on-primary mb-8 shadow-xl relative overflow-hidden">
                      <div className="relative z-10">
                        <h3 className="font-display-sm mb-2">
                          {activePlan === 'Taste' ? 'Taste (Free)' : activePlan === 'Savor' ? 'Savor Premium' : 'Feast Ultimate'}
                        </h3>
                        <p className="opacity-90 mb-6">
                          {activePlan === 'Taste' 
                            ? '3 AI Recipes/day • 1 Preference • 1 Planner Slot' 
                            : activePlan === 'Savor' 
                            ? 'Unlimited Recipes • Multi-Preferences • Smart Pantry Tracking' 
                            : 'Everything in Savor • Family Kitchen Hub • AI Voice Coach'}
                        </p>
                        <div className="flex items-baseline gap-2 mb-8">
                          <span className="text-display-lg font-bold">
                            {activePlan === 'Taste' ? 'Free' : activePlan === 'Savor' ? '₹199' : '₹249'}
                          </span>
                          {activePlan !== 'Taste' && <span className="opacity-70">/ month</span>}
                        </div>
                        <button 
                          onClick={() => setIsSubscriptionModalOpen(true)}
                          className="bg-surface text-primary px-8 py-3 rounded-full font-label-lg hover:scale-105 transition-transform active:scale-95 shadow-md"
                        >
                          {activePlan === 'Taste' ? 'Upgrade Plan' : 'Manage Subscription'}
                        </button>
                      </div>
                      <span className="absolute -bottom-10 -right-10 material-symbols-outlined !text-[15rem] opacity-10">payments</span>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-label-lg text-on-surface-variant">Billing History</h4>
                      {[
                        { date: 'May 1, 2026', amount: activePlan === 'Feast' ? '₹249.00' : '₹199.00', status: 'Paid' },
                        { date: 'Apr 1, 2026', amount: activePlan === 'Feast' ? '₹249.00' : '₹199.00', status: 'Paid' }
                      ].map((bill, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors">
                          <div>
                            <p className="font-label-lg">{bill.date}</p>
                            <p className="text-label-sm text-on-surface-variant">Visa ending in 4242</p>
                          </div>
                          <div className="text-right">
                            <p className="font-label-lg">{bill.amount}</p>
                            <p className="text-label-sm text-green-500">{bill.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}

                {activeTab === 'security' && (
                  <motion.section
                    key="security"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface-container rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm"
                  >
                    <h2 className="font-headline-md mb-6">Security & Privacy</h2>
                    <div className="space-y-4">
                      <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-on-surface-variant">password</span>
                          <span className="font-label-lg">Change Password</span>
                        </div>
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      </button>
                      <button 
                        onClick={() => setIsTwoFactorModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-on-surface-variant">security</span>
                          <span className="font-label-lg">Two-Factor Authentication</span>
                        </div>
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      </button>
                      <button
                        onClick={() => setIsRateModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-on-surface-variant">star</span>
                          <div className="text-left">
                            <span className="font-label-lg block">Rate Epicurean AI</span>
                            <span className="text-label-sm text-on-surface-variant">Love the app? Leave us a review!</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-colors text-red-500"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined">delete_forever</span>
                          <span className="font-label-lg">Delete Account</span>
                        </div>
                      </button>
                    </div>
                  </motion.section>
                )}

                {activeTab === 'legal' && (
                  <motion.section
                    key="legal"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-surface-container rounded-[2.5rem] p-8 border border-outline-variant/30 shadow-sm"
                  >
                    <h2 className="font-headline-md mb-6">Legal & Policies</h2>
                    <p className="text-on-surface-variant font-body-md mb-6">Access our terms, privacy statements, and billing guarantees.</p>
                    <div className="space-y-4">
                      <Link 
                        to="/terms"
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-on-surface-variant">gavel</span>
                          <span className="font-label-lg">Terms & Conditions</span>
                        </div>
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      </Link>
                      <Link 
                        to="/privacy"
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-on-surface-variant">verified_user</span>
                          <span className="font-label-lg">Privacy Policy</span>
                        </div>
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      </Link>
                      <Link 
                        to="/refund"
                        className="w-full flex items-center justify-between p-4 rounded-xl border border-outline-variant/20 hover:bg-surface/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-on-surface-variant">currency_exchange</span>
                          <span className="font-label-lg">Refund Policy</span>
                        </div>
                        <span className="material-symbols-outlined text-outline">chevron_right</span>
                      </Link>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>
            </main>
            <div className="mt-8 text-center text-label-sm text-on-surface-variant/40 pb-4">
              Epicurean AI App v2.2.6 (Build 21)
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPasswordModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface-container p-8 rounded-[3rem] shadow-2xl overflow-hidden">
              {isSuccess ? (
                <div className="text-center py-12 px-8">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-primary !text-4xl">check</span>
                  </div>
                  <h3 className="font-headline-lg mb-2">Password Updated</h3>
                  <p className="text-on-surface-variant">Your security credentials have been successfully reset.</p>
                </div>
              ) : (
                <div className="p-8">
                  <h3 className="font-headline-lg mb-6">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-label-md font-label-md pl-1">Current Password</label>
                      <div className="relative">
                        <input type={showCurrentPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full p-4 pr-12 rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all" />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-xl">{showCurrentPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-md font-label-md pl-1">New Password</label>
                      <div className="relative">
                        <input type={showNewPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full p-4 pr-12 rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all" />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-xl">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-md font-label-md pl-1">Confirm New Password</label>
                      <div className="relative">
                        <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full p-4 pr-12 rounded-xl bg-surface border border-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-xl">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleSecurityAction('password')} className="w-full py-4 bg-primary text-on-primary rounded-2xl font-label-lg mt-8 hover:shadow-xl active:scale-95 transition-all">Update Password</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTwoFactorModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTwoFactorModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface-container p-8 rounded-[3rem] shadow-2xl overflow-hidden">
              {isSuccess ? (
                <div className="text-center py-12 px-8">
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-primary !text-4xl">verified_user</span>
                  </div>
                  <h3 className="font-headline-lg mb-2">2FA Enabled</h3>
                  <p className="text-on-surface-variant">Your account is now protected with two-factor authentication.</p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <h3 className="font-headline-lg mb-4">Enable 2FA</h3>
                  <p className="text-on-surface-variant mb-8">Protect your culinary secrets with an extra layer of security.</p>
                  <div className="bg-surface p-8 rounded-3xl border border-dashed border-outline-variant flex flex-col items-center mb-8 shadow-inner">
                    <div className="w-48 h-48 bg-white p-4 rounded-2xl mb-4">
                      <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=EpicureanAI-2FA" alt="QR Code" className="w-full h-full opacity-80" />
                    </div>
                    <p className="text-label-sm font-mono bg-surface-container px-3 py-1 rounded-full border border-outline-variant/30">KEY: EP1C-UR3A-N2FA</p>
                  </div>
                  <div className="space-y-4">
                    <input type="text" placeholder="Enter 6-digit code" className="w-full p-4 text-center text-display-sm tracking-[0.5em] rounded-xl bg-surface border border-outline-variant outline-none" maxLength="6" />
                    <button onClick={() => handleSecurityAction('2fa')} className="w-full py-4 bg-primary text-on-primary rounded-2xl font-label-lg hover:shadow-xl active:scale-95 transition-all">Verify & Enable</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDeleteModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface-container p-8 rounded-[3rem] shadow-2xl overflow-hidden">
              {isSuccess ? (
                <div className="text-center py-12 px-8">
                  <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-red-500 !text-4xl">person_off</span>
                  </div>
                  <h3 className="font-headline-lg mb-2">Account Deleted</h3>
                  <p className="text-on-surface-variant">We're sorry to see you go. Your data has been wiped from our kitchen.</p>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <h3 className="font-headline-lg text-red-500 mb-4">Delete Account</h3>
                  <p className="text-on-surface-variant mb-8">This action is permanent and will delete all your recipes, flavor profiles, and kitchen data.</p>
                  <div className="space-y-4">
                    <button onClick={() => handleSecurityAction('delete')} className="w-full py-4 bg-red-500 text-white rounded-2xl font-label-lg hover:bg-red-600 transition-colors">I Understand, Delete My Account</button>
                    <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-4 text-on-surface-variant font-label-lg hover:underline">Cancel</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsRateModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-surface-container p-8 rounded-[3rem] shadow-2xl text-center">
              <div className="w-20 h-20 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-amber-400 !text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
              <h3 className="font-headline-lg mb-2">Enjoying Epicurean AI?</h3>
              <p className="text-on-surface-variant font-body-md mb-6">Your review helps other food lovers discover the app and helps us keep improving.</p>
              <div className="flex justify-center gap-2 mb-8">
                {[1,2,3,4,5].map(star => (
                  <span key={star} className="material-symbols-outlined text-amber-400 !text-4xl cursor-pointer hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                ))}
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=epicurean.kitchen.app"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsRateModalOpen(false)}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-label-lg block text-center hover:shadow-xl active:scale-95 transition-all mb-3"
              >
                Rate on Google Play
              </a>
              <button onClick={() => setIsRateModalOpen(false)} className="w-full py-3 text-on-surface-variant font-label-md hover:underline">Maybe Later</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSubscriptionModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubscriptionModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-4xl bg-surface-container p-6 md:p-8 rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh] z-50">
              <button 
                onClick={() => setIsSubscriptionModalOpen(false)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-surface-variant/20 flex items-center justify-center hover:bg-surface-variant/40 transition-colors z-10 animate-fade-in"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              {isSuccess && successType === 'subscription' ? (
                <div className="text-center py-16 px-8 flex flex-col items-center">
                  <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner animate-scale-in">
                    <span className="material-symbols-outlined !text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  </div>
                  <h3 className="font-display-md text-display-md text-on-surface mb-2">Subscription Updated!</h3>
                  <p className="text-on-surface-variant font-body-lg max-w-md">
                    Successfully activated the <span className="font-bold text-primary">{selectedPlan}</span> plan. Your premium privileges are now live!
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="font-headline-lg text-center mb-8">Manage Your Subscription</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                    {[
                      { name: 'Taste', price: 'Free', features: ['3 AI recipe suggestions/day', '1 active dietary preference', '1 saved meal plan slot', 'Generic base recipes'] },
                      { name: 'Savor', price: '₹199/mo', features: ['Unlimited premium AI recipes', 'Stack multiple preferences', '7-day planning & grocery list', 'Smart Pantry matching', 'Adapted to local cuisine'] },
                      { name: 'Feast', price: '₹249/mo', features: ['Everything in Savor tier', 'Shared Family Kitchen Hub', 'AI interactive voice coach', 'Priority step-by-step guidance', 'Exclusive culinary masterclasses'] }
                    ].map((plan, i) => {
                      const isActive = activePlan === plan.name;
                      let btnLabel = 'Upgrade';
                      if (isActive) {
                        btnLabel = 'Current Plan';
                      } else {
                        if (plan.name === 'Taste') {
                          btnLabel = 'Downgrade to Free';
                        } else if (plan.name === 'Savor') {
                          btnLabel = activePlan === 'Feast' ? 'Downgrade to Savor' : 'Upgrade to Savor';
                        } else if (plan.name === 'Feast') {
                          btnLabel = 'Upgrade to Feast';
                        }
                      }

                      return (
                        <div key={i} className={`p-6 rounded-3xl border flex flex-col transition-all duration-300 ${
                          isActive 
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/5 scale-[1.02]' 
                            : 'border-outline-variant/30 bg-surface/50 hover:bg-surface hover:border-outline-variant'
                        }`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-headline-sm">{plan.name}</h4>
                            {isActive && <span className="px-2 py-0.5 text-[9px] uppercase tracking-wider bg-primary text-on-primary rounded font-bold">Active</span>}
                          </div>
                          <p className="text-display-sm font-bold text-primary mb-4">{plan.price}</p>
                          <ul className="space-y-3 mb-8 flex-1">
                            {plan.features.map((f, j) => (
                              <li key={j} className="flex items-center gap-2 text-label-md text-on-surface-variant">
                                <span className="material-symbols-outlined text-[18px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                          <button 
                            disabled={isActive}
                            onClick={() => {
                              if (plan.name === 'Taste') {
                                setSelectedPlan(plan.name);
                                handleSecurityAction('subscription', plan.name);
                              } else {
                                setIsSubscriptionModalOpen(false);
                                navigate('/checkout', { state: { planName: plan.name } });
                              }
                            }}
                            className={`w-full py-3 rounded-xl font-label-lg transition-all ${
                              isActive 
                                ? 'bg-outline-variant text-on-surface cursor-default opacity-80' 
                                : 'bg-primary text-on-primary hover:shadow-lg active:scale-95'
                            }`}
                          >
                            {btnLabel}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccountSettings;
