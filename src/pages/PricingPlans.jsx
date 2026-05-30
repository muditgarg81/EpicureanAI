import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { 
  getLocalizedPricing, 
  formatCurrency, 
  getDetectedCountry, 
  getSupportedRegions 
} from '../services/currencyService';

const PricingPlans = () => {
  const [selectedRegion, setSelectedRegion] = useState(getDetectedCountry());
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoCodeError] = useState('');
  const setActivePlan = useAppStore(state => state.setActivePlan);
  const navigate = useNavigate();

  const pricing = getLocalizedPricing(selectedRegion);
  const regions = getSupportedRegions();

  const handleApplyPromo = () => {
    console.log("Checking promo:", promoCode);
    if (promoCode.trim().toUpperCase() === 'BAZINGA') {
      console.log("Promo Code BAZINGA applied successfully!");
      setActivePlan('Feast');
      alert('Promo Code BAZINGA Applied! You now have full access to the Feast plan for free.');
      navigate('/discovery');
    } else {
      setPromoCodeError('Invalid Promo Code');
      setTimeout(() => setPromoCodeError(''), 3000);
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24 overflow-x-hidden">
      <main className="pt-24 px-4 max-w-full mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-wider border border-primary/20">
              <span className="material-symbols-outlined text-[14px]">public</span>
              Regional Pricing Active ({pricing.currency})
            </div>
            
            {/* Promo Code Input */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex gap-2 bg-surface-container rounded-full p-1 pl-4 border border-outline-variant/30 focus-within:border-primary transition-all">
                <input
                  type="text"
                  placeholder="Enter Promo Code"
                  className="bg-transparent border-none focus:ring-0 text-sm font-label-md w-40"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                />
                <button
                  onClick={handleApplyPromo}
                  className="bg-primary text-on-primary px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-tight active:scale-95 transition-transform"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-error text-[10px] font-bold uppercase tracking-widest">{promoError}</p>}
            </div>

            {/* Manual Switcher */}
            <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1 border border-outline-variant/30">
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                    selectedRegion === r 
                    ? 'bg-primary text-on-primary shadow-sm' 
                    : 'text-on-surface-variant hover:bg-outline-variant/20'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <h2 className="font-display-lg text-3xl md:text-5xl mb-4 text-on-surface">Choose Your Culinary Journey</h2>
          <p className="font-body-md md:font-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
            Unlock exclusive global recipes, AI-powered nutritional coaching, and a vibrant community of world chefs.
          </p>
          {/* Toggle Switch */}
          <div className="flex items-center justify-center gap-4">
            <span className="font-label-md text-label-md text-on-surface-variant">Monthly</span>
            <div className="w-14 h-7 bg-surface-container-highest rounded-full p-1 flex items-center cursor-pointer transition-colors hover:bg-outline-variant">
              <div className="w-5 h-5 bg-primary rounded-full shadow-sm"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-md text-label-md text-primary font-bold">Yearly</span>
              <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded-full uppercase tracking-wider">{pricing.plans.yearly_discount}</span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-xl">
          {/* Taste (Free) */}
          <div className="bg-surface-container-low rounded-xl p-8 flex flex-col border border-transparent transition-all hover:shadow-lg">
            <div className="mb-8">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Taste</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Build your daily culinary habit</p>
            </div>
            <div className="mb-8">
              <span className="font-display-lg text-display-lg text-on-surface">{formatCurrency(0)}</span>
              <span className="font-label-md text-label-md text-on-surface-variant">/month</span>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">3 AI recipe suggestions/day</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">1 active dietary preference</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">1 saved meal plan slot</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Smart leftover pantry tracking</span>
              </li>
              <li className="flex items-center gap-3 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-sm">cancel</span>
                <span className="font-body-md text-body-md">Personalized regional recipes</span>
              </li>
            </ul>
            <button className="w-full h-12 bg-outline-variant/20 text-on-surface font-label-md text-label-md rounded-lg hover:bg-outline-variant transition-colors active:scale-95">Current Plan</button>
          </div>

          {/* Savor (Pro) */}
          <div className="relative bg-surface-container-highest rounded-3xl p-8 flex flex-col border-2 border-primary shadow-xl z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-[12px] font-bold tracking-widest uppercase">Most Popular</div>
            <div className="mb-8">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Savor</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">The standard premium experience</p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface">{formatCurrency(pricing.plans.pro)}</span>
                <span className="font-label-md text-label-md text-on-surface-variant">/month</span>
              </div>
              <p className="text-secondary font-label-sm text-label-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Includes 30-day free trial
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Unlimited premium AI recipes</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Stack multiple preferences</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">7-day planning & grocery list</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Smart Pantry matching</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Adapted to local cuisine</span>
              </li>
            </ul>
            <Link to="/checkout" state={{ planName: 'Savor' }} className="w-full h-12 flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md rounded-lg shadow-md hover:opacity-90 transition-opacity active:scale-95">
              Start 30-Day Free Trial
            </Link>
          </div>

          {/* Feast */}
          <div className="bg-surface-container-low rounded-xl p-8 flex flex-col border border-transparent transition-all hover:shadow-lg">
            <div className="mb-8">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Feast</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">For ultimate health & sharing</p>
            </div>
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="font-display-lg text-display-lg text-on-surface">{formatCurrency(pricing.plans.family)}</span>
                <span className="font-label-md text-label-md text-on-surface-variant">/month</span>
              </div>
              <p className="text-secondary font-label-sm text-label-sm mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                Includes 30-day free trial
              </p>
            </div>
            <ul className="space-y-4 mb-10 flex-grow">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Everything in Savor tier</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Shared Family Kitchen Hub</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">AI interactive voice coach</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Priority step-by-step guidance</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-body-md text-body-md">Exclusive masterclasses</span>
              </li>
            </ul>
            <Link to="/checkout" state={{ planName: 'Feast' }} className="w-full h-12 flex items-center justify-center bg-primary-container text-on-primary-container font-label-md text-label-md rounded-lg shadow-sm hover:opacity-90 transition-opacity active:scale-95">
              Upgrade to Feast
            </Link>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="mb-xl">
          <h2 className="font-headline-lg text-headline-lg text-center mb-12">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="py-6 px-4 font-label-md text-label-md text-on-surface-variant w-1/3">Features</th>
                  <th className="py-6 px-4 font-headline-md text-headline-md text-on-surface">Taste</th>
                  <th className="py-6 px-4 font-headline-md text-headline-md text-primary">Savor</th>
                  <th className="py-6 px-4 font-headline-md text-headline-md text-on-surface">Feast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                <tr>
                  <td className="py-6 px-4">
                    <span className="font-body-md text-body-md font-semibold text-on-surface block">Recipe Suggestions</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Daily generation limits</span>
                  </td>
                  <td className="py-6 px-4 font-body-md text-body-md">3 suggestions/day</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">Unlimited</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-6 px-4">
                    <span className="font-body-md text-body-md font-semibold text-on-surface block">Dietary Preferences</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Active preference matching</span>
                  </td>
                  <td className="py-6 px-4 font-body-md text-body-md">1 preference active</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">Stackable preferences</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">Multi-profile family profiles</td>
                </tr>
                <tr>
                  <td className="py-6 px-4">
                    <span className="font-body-md text-body-md font-semibold text-on-surface block">Nutritional Coaching</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Real-time macro tracking</span>
                  </td>
                  <td className="py-6 px-4 font-body-md text-body-md">Basic only</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">Advanced trends (90d)</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">AI Voice Coach + Wearables</td>
                </tr>
                <tr>
                  <td className="py-6 px-4">
                    <span className="font-body-md text-body-md font-semibold text-on-surface block">Multi-User Sync</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Simultaneous access</span>
                  </td>
                  <td className="py-6 px-4 font-body-md text-body-md">1 person</td>
                  <td className="py-6 px-4 font-body-md text-body-md">1 person</td>
                  <td className="py-6 px-4 font-body-md text-body-md font-bold">Up to 6 profiles</td>
                </tr>
                <tr>
                  <td className="py-6 px-4">
                    <span className="font-body-md text-body-md font-semibold text-on-surface block">Pantry Intelligence</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Match leftover ingredients</span>
                  </td>
                  <td className="py-6 px-4"><span className="material-symbols-outlined text-outline-variant">horizontal_rule</span></td>
                  <td className="py-6 px-4"><span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></td>
                  <td className="py-6 px-4"><span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Bento Style Feature Showcase */}
        <section className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[600px] mb-xl">
          <div className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl group min-h-[300px]">
            <img 
              alt="Kitchen scene" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDctEvDMbRlGV4AjH0C21xmYaqA_S080aN8EMXUJrdoosGf7L1BcpBSLEG3x9lpaRqt-t0bqNmK8fEMoCIBPRuLJjQym94W6zkZWGwiIitnpXq7nH7PG6_TtyKm9VIWKU_s4DS_ofN5t9wH9HVdVuC8zAYwahatrOhRKSxMZferoA--v-zdpZ_nBE4kULYnwGDG1NUY4Zn4bFwI-xdhCWUOHh5aMX2Nq388wMnH_hzLJjUdN0QtiEDvy8okiTFYTk6pbPFl92Ud01A"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
              <h4 className="text-white font-headline-lg text-headline-lg mb-2">Immersive AI Cooking</h4>
              <p className="text-white/80 font-body-md text-body-md">Step-by-step visual guidance that adapts to your speed.</p>
            </div>
          </div>
          <div className="md:col-span-2 bg-secondary-container/30 rounded-2xl p-8 flex items-center gap-6 min-h-[150px]">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-4xl">language</span>
            </div>
            <div>
              <h4 className="font-headline-md text-headline-md text-on-surface mb-1">Global Pantry</h4>
              <p className="font-body-md text-body-md text-on-surface-variant">Sourcing recommendations for rare international spices.</p>
            </div>
          </div>
          <div className="bg-primary-container/20 rounded-2xl p-8 flex flex-col justify-center text-center min-h-[150px]">
            <span className="material-symbols-outlined text-primary text-4xl mb-4">groups</span>
            <h4 className="font-label-md text-label-md text-on-surface font-bold">Chef Circle</h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Direct Q&A with master chefs.</p>
          </div>
          <div className="bg-surface-container-highest rounded-2xl p-8 flex flex-col justify-center text-center min-h-[150px]">
            <span className="material-symbols-outlined text-on-surface text-4xl mb-4">analytics</span>
            <h4 className="font-label-md text-label-md text-on-surface font-bold">Smart Macros</h4>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Automated nutritional tracking.</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PricingPlans;
