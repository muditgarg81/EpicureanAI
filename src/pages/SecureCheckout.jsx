import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { initiateCheckout } from '../services/razorpayService';
import useAppStore from '../store/useAppStore';
import useAuthStore from '../store/useAuthStore';
import { supabase } from '../services/supabaseClient';

const SecureCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setActivePlan = useAppStore(state => state.setActivePlan);
  const user = useAuthStore(state => state.user);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [isEligibleForTrial, setIsEligibleForTrial] = useState(false);
  const [checkingTrial, setCheckingTrial] = useState(true);

  const targetPlanName = location.state?.planName || 'Savor';

  // Map different names safely to our three main plans
  let activePlanKey = 'Savor';
  if (targetPlanName === 'Gourmet Explorer' || targetPlanName === 'Sous Chef' || targetPlanName === 'Taste') {
    activePlanKey = 'Taste';
  } else if (targetPlanName === 'Global Chef' || targetPlanName === 'Executive Chef' || targetPlanName === 'Savor') {
    activePlanKey = 'Savor';
  } else if (targetPlanName === 'Family Kitchen' || targetPlanName === 'Kitchen Dynasty' || targetPlanName === 'Feast') {
    activePlanKey = 'Feast';
  }

  // Set prices and details dynamically according to Claude AI recommendations
  const planInfo = {
    'Taste': {
      title: 'Taste Tier',
      priceText: 'Free',
      subtotal: 0,
      gst: 0,
      total: 0,
      desc: 'Billed Free',
      features: '3 AI suggestions/day • 1 dietary preference • 1 planner slot'
    },
    'Savor': {
      title: 'Savor Premium',
      priceText: '₹199',
      subtotal: 199,
      gst: 35.82,
      total: 234.82,
      desc: 'Billed Monthly',
      features: 'Unlimited premium recipes • Multi-Preferences • Smart Pantry Tracking'
    },
    'Feast': {
      title: 'Feast Ultimate',
      priceText: '₹249',
      subtotal: 249,
      gst: 44.82,
      total: 293.82,
      desc: 'Billed Monthly',
      features: 'Everything in Savor • Shared Family Kitchen Hub • AI Voice Coach'
    }
  }[activePlanKey];

  useEffect(() => {
    const checkTrial = async () => {
      if (!user?.email || activePlanKey === 'Taste') {
        setCheckingTrial(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('free_trials')
          .select('email')
          .eq('email', user.email)
          .maybeSingle();
          
        if (!error && !data) {
          setIsEligibleForTrial(true);
        }
      } catch (e) {
        console.error("Error checking trial", e);
      }
      setCheckingTrial(false);
    };
    checkTrial();
  }, [user, activePlanKey]);

  const handlePayment = async () => {
    if (planInfo.total === 0 || promoApplied) {
      setActivePlan(activePlanKey);
      navigate('/success', { state: { planName: activePlanKey } });
      return;
    }

    if (isEligibleForTrial && !promoApplied) {
      // Record trial usage
      await supabase.from('free_trials').insert({ email: user.email });
      
      // Calculate 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      setActivePlan(activePlanKey, expiresAt.toISOString());
      navigate('/success', { state: { planName: activePlanKey } });
      return;
    }

    initiateCheckout(planInfo.total, 
      (response) => {
        console.log("Payment successful:", response);
        setActivePlan(activePlanKey);
        navigate('/success', { state: { planName: activePlanKey } });
      },
      (error) => {
        console.error("Payment failed:", error);
      }
    );
  };

  const handleApplyPromo = () => {
    console.log("Applying promo in checkout:", promoCode);
    if (promoCode.trim().toUpperCase() === 'BAZINGA') {
      setPromoApplied(true);
      alert('Promo Code BAZINGA Applied! Your total is now ₹0.00');
    } else {
      setPromoApplied(false);
      alert('Invalid Promo Code');
    }
  };

  return (
    <div className="font-body-md text-body-md bg-background text-on-background min-h-screen overflow-x-hidden">
      {/* Top Navigation (Transactional Style) */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-4 w-full max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="active:scale-95 transition-transform duration-200"
            >
              <span className="material-symbols-outlined text-on-surface">arrow_back</span>
            </button>
            <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Secure Checkout</h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <span className="font-label-md text-label-md text-secondary">Bank-grade security</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-xl px-4 max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter lg:gap-xl">
          {/* Left Column: Order Details & Payment */}
          <div className="lg:col-span-7 space-y-md">
            {/* Plan Summary Card */}
            <section className="bg-surface-container rounded-xl p-md shadow-[0_4px_12px_rgba(26,25,21,0.04)]">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-md">Plan Summary</h2>
              <div className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-lg border border-outline-variant/30">
                <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    alt="Kitchen scene" 
                    className="h-full w-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuASO_dhbWxW4k8Lx7S0XfvwRGa54xI-BfRl-CoK8dkCI9hk_SrdpyWciSwzzquwZXQFlgSnvG8TT0VU5HlZC_5Xry79ZqNFHIJJf3Ob-4bBC6a4OPTxru6oknyr5ADW4v_M1Uvwj9iMjpEPrhIwPMA7ge3J0KGxMXBCobSWvaIrAk_uLtrZkdmGHPDVX-obg1t_OctmU4tFp_8Fj2eujJldYzVxrtcjTPwFfj44s17cD0ol4Fcoq1uwo9f6lcuTMDRGNM2Y3f5zOYM"
                  />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-headline-md text-body-lg text-primary">{planInfo.title}</h3>
                      <p className="font-body-md text-on-surface-variant">{planInfo.desc}</p>
                    </div>
                    <span className="font-headline-md text-body-lg text-on-surface">{planInfo.priceText}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Payment Methods Section */}
            <section className="space-y-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface">Payment Method</h2>
              {/* Saved Cards / New Card */}
              <div className="space-y-sm">
                <label className="flex items-center p-md border-2 border-primary bg-primary-container/10 rounded-xl cursor-pointer transition-all">
                  <input defaultChecked className="w-5 h-5 text-primary border-outline focus:ring-primary" name="payment" type="radio" />
                  <div className="ml-md flex flex-grow items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary">credit_card</span>
                      <span className="font-label-md text-label-md text-on-primary-container">•••• •••• •••• 4242</span>
                    </div>
                    <img alt="Visa" className="h-4 opacity-70" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGWC5qo2TMXoZJSmsA7W6pA7fnIGy0ENtXabackIYmMVqxjPzduDdfO38N6TURTh-LpRrVwloNOUN314C3fDfX0XaTPbz29haRcyKQndv-RFCf4uLVtVBVqOrfjcPxUauNSKfVCGWQ30XdXvpL-2ZL2F_3uq7FX8J7cRIEMmgxnTPod2xHZqbEHvBOS-MYLy0TV8M7BqMcojeKz9tuniGHwrm4MQWV8rLS7ORDMAmqJb02G9izxj5zaa1QBFRxD8IE0BSDphIir6w" />
                  </div>
                </label>

                <label className="flex items-center p-md border border-outline-variant bg-surface rounded-xl cursor-pointer hover:bg-surface-container-low transition-all">
                  <input className="w-5 h-5 text-primary border-outline focus:ring-primary" name="payment" type="radio" />
                  <div className="ml-md flex flex-grow items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-on-surface-variant">account_balance_wallet</span>
                      <span className="font-label-md text-label-md text-on-surface-variant">UPI</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-outline px-2 py-0.5 border border-outline-variant rounded">Popular</span>
                  </div>
                </label>
              </div>

              {/* New Card Input Form */}
              <div className="pt-sm space-y-md bg-surface-container-low/50 p-md rounded-xl border border-dashed border-outline-variant">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Cardholder Name</label>
                    <input className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 py-2 outline-none transition-colors" placeholder="John Doe" type="text" />
                  </div>
                  <div className="space-y-xs">
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Card Number</label>
                    <input className="w-full bg-transparent border-b border-outline-variant focus:border-primary focus:ring-0 py-2 outline-none transition-colors" placeholder="0000 0000 0000 0000" type="text" />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary & Trust */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-md">
              {/* Glassmorphism Pricing Summary */}
              <div className="glass-panel p-md rounded-xl shadow-lg border border-white/40 ring-1 ring-primary/10">
                <h2 className="font-headline-md text-headline-md text-primary mb-md">Order Summary</h2>
                <div className="space-y-sm">
                  <div className="flex justify-between font-body-md">
                    <span className="text-on-surface-variant">Subtotal</span>
                    <span className="text-on-surface">₹{planInfo.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-body-md">
                    <span className="text-on-surface-variant">GST (18%)</span>
                    <span className="text-on-surface">₹{planInfo.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-body-md text-secondary">
                    <span>Platform Discount</span>
                    <span>-₹{promoApplied ? planInfo.total.toFixed(2) : "0.00"}</span>
                  </div>
                  <div className="h-px bg-outline-variant/30 my-md"></div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-headline-md text-headline-md text-on-surface">Total</span>
                    <span className="font-display-lg text-display-lg text-primary">₹{promoApplied ? "0.00" : planInfo.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button disabled={checkingTrial} onClick={handlePayment} className="w-full mt-lg h-14 bg-primary text-on-primary rounded-full font-label-md text-label-md flex items-center justify-center gap-2 shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {checkingTrial ? (
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                  )}
                  {checkingTrial ? 'Checking...' : promoApplied ? 'Get Access Now' : isEligibleForTrial ? 'Start 30-Day Free Trial' : 'Secure Checkout'}
                </button>
                <p className="text-center mt-md font-label-sm text-label-sm text-outline">
                  By clicking, you agree to our <Link to="/terms" className="text-primary hover:underline font-bold">Terms of Service</Link>.
                </p>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-sm">
                <div className="flex flex-col items-center justify-center p-sm bg-surface-container-high rounded-xl text-center">
                  <span className="material-symbols-outlined text-secondary mb-xs">verified</span>
                  <span className="font-label-sm text-label-sm text-on-surface">SSL Encrypted</span>
                </div>
                <Link to="/refund" className="flex flex-col items-center justify-center p-sm bg-surface-container-high rounded-xl text-center hover:bg-surface-container-highest transition-colors active:scale-95 cursor-pointer">
                  <span className="material-symbols-outlined text-secondary mb-xs">currency_exchange</span>
                  <span className="font-label-sm text-label-sm text-on-surface">7-Day Refund</span>
                </Link>
              </div>

              {/* Promo Code */}
              <div className="flex gap-sm">
                <input
                  className="flex-grow bg-surface-container-low border-none rounded-full px-md py-3 text-label-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Promo Code"
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-md py-2 border-2 border-primary text-primary font-label-md text-label-md rounded-full hover:bg-primary/5 transition-colors active:scale-95"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Security Badge for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-40">
        <div className="bg-secondary text-on-secondary px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
          <span className="font-label-sm text-label-sm">Secure Payment</span>
        </div>
      </div>
    </div>
  );
};

export default SecureCheckout;
