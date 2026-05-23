import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
  const location = useLocation();
  const purchasedPlan = location.state?.planName || 'Executive Chef';

  const getNextBillingDate = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const planNameFormatted = {
    'Sous Chef': 'Taste Free Plan',
    'Taste': 'Taste Free Plan',
    'Executive Chef': 'Savor Premium Plan',
    'Savor': 'Savor Premium Plan',
    'Kitchen Dynasty': 'Feast Ultimate Plan',
    'Feast': 'Feast Ultimate Plan'
  }[purchasedPlan] || 'Savor Premium Plan';

  const planFeatures = {
    'Sous Chef': '3 AI suggestions/day • 1 dietary preference • 1 planner slot',
    'Taste': '3 AI suggestions/day • 1 dietary preference • 1 planner slot',
    'Executive Chef': 'Unlimited premium recipes • Multi-Preferences • Smart Pantry Tracking',
    'Savor': 'Unlimited premium recipes • Multi-Preferences • Smart Pantry Tracking',
    'Kitchen Dynasty': 'Everything in Savor • Shared Family Kitchen Hub • AI Voice Coach',
    'Feast': 'Everything in Savor • Shared Family Kitchen Hub • AI Voice Coach'
  }[purchasedPlan] || 'Unlimited premium recipes • Multi-Preferences • Smart Pantry Tracking';

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md overflow-x-hidden">
      <main className="flex-grow flex flex-col items-center justify-center px-container-margin py-xl max-w-4xl mx-auto text-center relative w-full">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-20 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-primary-container rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-64 h-64 bg-secondary-container rounded-full blur-3xl"></div>
        </div>

        {/* Simulated Animation Component (Chef Hat) */}
        <div className="relative mb-lg">
          <div className="w-32 h-32 md:w-48 md:h-48 bg-primary-container/20 rounded-full flex items-center justify-center chef-hat-glow">
            <span className="material-symbols-outlined text-primary text-[64px] md:text-[96px]" style={{ fontVariationSettings: "'FILL' 1" }}>cooking</span>
          </div>
          {/* Floating Sparkles */}
          <div className="absolute -top-4 -right-4">
            <span className="material-symbols-outlined text-inverse-primary text-3xl">colors_spark</span>
          </div>
          <div className="absolute top-1/2 -left-8">
            <span className="material-symbols-outlined text-secondary text-2xl">celebration</span>
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-md mb-lg">
          <h1 className="font-display-lg text-display-lg text-on-background tracking-tight">Welcome to the Kitchen, Chef!</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
            Your journey into the world of AI-assisted culinary excellence begins now. We've sharpened the knives and preheated the oven for you.
          </p>
        </div>

        {/* Subscription Summary Card (Glassmorphism) */}
        <div className="glass-panel w-full rounded-xl p-md mb-lg shadow-sm border border-white/50 text-left max-w-md mx-auto">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Active Subscription</span>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-sm text-label-sm">Active</span>
          </div>
          <div className="flex items-center gap-base mb-md">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-symbols-outlined text-primary">workspace_premium</span>
            </div>
            <div>
              <h3 className="font-label-md text-label-md text-on-surface">{planNameFormatted}</h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{planFeatures}</p>
            </div>
          </div>
          <div className="border-t border-outline-variant pt-sm flex justify-between items-center">
            <p className="font-label-sm text-label-sm text-on-surface-variant">Next billing date: <span className="font-semibold">{getNextBillingDate()}</span></p>
            <Link to="/settings" state={{ tab: 'subscription' }} className="text-primary font-label-sm text-label-sm hover:underline">Manage</Link>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-gutter w-full max-w-md mx-auto">
          <Link to="/generator" className="flex-1 bg-primary text-on-primary font-label-md text-label-md py-4 px-lg rounded-full shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-base">
            <span className="material-symbols-outlined">psychology</span>
            Start AI Recipe
          </Link>
          <Link to="/discovery" className="flex-1 border border-outline text-on-surface font-label-md text-label-md py-4 px-lg rounded-full hover:bg-surface-container-low active:scale-95 transition-all flex items-center justify-center">
            Go to Home
          </Link>
        </div>

        {/* Image Bento Grid */}
        <div className="mt-xl grid grid-cols-4 grid-rows-2 gap-base h-48 md:h-64 w-full max-w-4xl">
          <div className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-sm">
            <img alt="Professional kitchen" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCahyeTxA28t6536O0cCju3oSdjjYQshcvUyl-ORkC-o3vLeLEW3_ki7a_wiHfbxJecwglT12Mpm1fohBk1dkLDQWip8EyVStGRohlNBtIVNmLphLtoXu4GiucUWLWLBoPp555RH4f7zaE4n-_7oq1N17BTBKhdAcPha1L3rLgAxxt_wa7ydQ2ttU5klkbWPBO9gHFU2GibML2BlOYhIzZYJAfEyaH-tyRJIYW1sek1b_p7_Z01I0fRxQh-G7K5rkFeLKcxgELXIC8" />
          </div>
          <div className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm">
            <img alt="Gourmet dish" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjB-_T4TOJ2Cvzwl9UV7FQj9pbRJITORiLGT5O6PwYUbUQgsSyXJIM-kFBIDMNuoSneMVd4rk2Um-VYYD54gxoTcNuXf_BTxMUb75N6UFpCSudl4GvaQPg7B_msSSIKUdK0pYJEljovwXgBasJW-fX8aIeZrGD4fAkuz_ogfr2vExQa2fv-M7-iqKOpCvgEjVCOhoC76hJXg-pWguR-7yMWBbFNg4_LeK_5QqawmRGyyekzHLGVzhYDKY4tvCe5b5VposIuh16E0g" />
          </div>
          <div className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-sm">
            <img alt="Spices" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKfsGUBxJLaVUZBFF8Tcx4JH5Pz6TkFhbJi25VYVeHWer38JQNPwmfHLJZpudsRWk3hCCosBEqwT_N6_aTjiUAloRs43YVNFM_1NDQ6JBHlY5AjNVfEDmCK4gZPy-CiE9x6QstT4XMtQ839oUnsd_njU7JpG81BL00amIrD73a8HARwDevaCLxcFZRCqF2f6hXqBjerp9E3JpMULrKxssSGUH74SWThWG16Pko3V0XRUVmeFzefq3IhjG3seBd9xuUARDgePgLeFw" />
          </div>
          <div className="col-span-1 row-span-1 rounded-xl overflow-hidden shadow-sm">
            <img alt="Fresh ingredients" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzs3lR083OCcd2ld6f7U_yHsEb7HHKNTqidN495RPPBi9lOZgBk9b8rOeI53NytZQdeNl8JLOdk1vkhJk2sH4Y5EJefQVVxo4tga_T5ZcL4U9nAQBBabrV2NHtFbNSEulY3zlwsMBhXdq9pCo4DyBT4K1M4ze4GJedrEB7XKZcREL3XUq5OGpeWZMDsSdpWmgfDx6YibgxCbrpwedKa0TAVRWoVfSI9IrK7CTo2h_D1PFkSKQSZ6w9KjmziBCdsp1fnSJWNvbhn-c" />
          </div>
        </div>
      </main>
      
      {/* Success Confetti (Visual-only representation) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full rotate-45"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-1 bg-secondary rounded-full -rotate-12"></div>
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-tertiary rounded-full rotate-90"></div>
        <div className="absolute top-1/2 right-1/2 w-4 h-1 bg-inverse-primary rounded-full rotate-180"></div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
