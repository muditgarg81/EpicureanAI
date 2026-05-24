import React from 'react';
import { Link } from 'react-router-dom';

const OnboardingIntro = () => {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col p-container-margin">
      <div className="flex-grow flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-xl py-xl">
        
        {/* Welcome Header */}
        <div className="space-y-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container rounded-full mb-md shadow-sm">
            <span className="material-symbols-outlined text-4xl text-on-primary-container">auto_awesome</span>
          </div>
          <h1 className="font-display-md text-primary">Welcome to Epicurean AI</h1>
          <p className="font-body-lg text-on-surface-variant max-w-xs mx-auto">
            Your personal, intelligent culinary assistant.
          </p>
        </div>

        {/* Features List */}
        <div className="w-full space-y-md text-left">
          <div className="glass-panel p-md rounded-xl border border-surface-variant flex items-start gap-md">
            <span className="material-symbols-outlined text-primary text-2xl mt-1">restaurant</span>
            <div>
              <h3 className="font-label-lg text-on-background mb-xs">AI Recipe Generation</h3>
              <p className="font-body-sm text-on-surface-variant">Turn the ingredients in your fridge into delicious global recipes instantly.</p>
            </div>
          </div>

          <div className="glass-panel p-md rounded-xl border border-surface-variant flex items-start gap-md">
            <span className="material-symbols-outlined text-secondary text-2xl mt-1">inventory_2</span>
            <div>
              <h3 className="font-label-lg text-on-background mb-xs">Smart Pantry Tracker</h3>
              <p className="font-body-sm text-on-surface-variant">Keep track of your stock and never waste food again with smart alerts.</p>
            </div>
          </div>

          <div className="glass-panel p-md rounded-xl border border-surface-variant flex items-start gap-md">
            <span className="material-symbols-outlined text-tertiary text-2xl mt-1">family_restroom</span>
            <div>
              <h3 className="font-label-lg text-on-background mb-xs">Family Kitchen Hub</h3>
              <p className="font-body-sm text-on-surface-variant">Collaborate on meal plans and shared grocery lists with your entire family.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="w-full mt-xl pt-lg">
          <Link 
            to="/onboarding/preferences" 
            className="w-full bg-primary text-on-primary h-[56px] rounded-full font-label-md flex items-center justify-center gap-sm hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            Set Up My Preferences
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <p className="font-body-sm text-on-surface-variant text-center mt-md">
            It only takes 30 seconds.
          </p>
        </div>

      </div>
    </div>
  );
};

export default OnboardingIntro;
