import React from 'react';
import { Link } from 'react-router-dom';

const OnboardingComplete = () => {
  return (
    <div className="bg-[#FFFDF5] text-on-surface antialiased min-h-screen flex flex-col items-center justify-center px-container-margin relative overflow-hidden">
      {/* Background Hero Element */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover opacity-15"
          alt="Gourmet kitchen marble countertop"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2ouPUw3SM44EGJ2wqV_31HCGyYncp6_i8UOre1AlSM0SaTcIuwftYLc7XYNJ7gaZtiKPR2_hAQUA54Il_rJCSrEEJU8rjoI6IavZmrvRfL8V_5NxMJaA8f8wp9V1jHVHkNCgUxF2yrI4709ysPdgD1BEJSmZYYHvONPqrpaaKxPQv5AIRv1_lRn2BpE2vmv-2aZBkybStm-7gD7fXBTvEHvJtiYRKZUMVLIQI7VBY_deRTThf37aAwP7K8Rz6vpox63aXtDG4t8w"
        />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-xl text-center flex flex-col items-center space-y-lg">
        {/* Success Visual */}
        <div className="relative w-32 h-32 md:w-40 md:h-40">
          <div className="absolute inset-0 bg-primary-container rounded-full opacity-20 scale-125"></div>
          <div className="w-full h-full bg-primary-container rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-6xl md:text-7xl text-on-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-secondary text-on-secondary p-3 rounded-full shadow-md flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">check</span>
          </div>
        </div>

        {/* Headlines */}
        <div className="space-y-sm">
          <h1 className="font-display-lg text-display-lg text-primary tracking-tight">You're ready to cook, Chef!</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto">
            Your personalized culinary journey is set up and waiting for you.
          </p>
        </div>

        {/* Summary Bento Card */}
        <div className="glass-panel p-md rounded-xl w-full text-left shadow-[0_12px_40px_rgba(26,25,21,0.08)] border border-surface-variant">
          <h2 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-md">Your Profile Summary</h2>
          <div className="grid grid-cols-2 gap-gutter">
            {/* Cuisine Focus */}
            <div className="bg-surface-container p-sm rounded-lg flex items-center space-x-sm">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-xl">public</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Cuisine</p>
                <p className="font-label-md text-label-md">Italian & Thai</p>
              </div>
            </div>
            {/* Skill Level */}
            <div className="bg-surface-container p-sm rounded-lg flex items-center space-x-sm">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-xl">skillet</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Level</p>
                <p className="font-label-md text-label-md">Intermediate</p>
              </div>
            </div>
            {/* AI Coach */}
            <div className="bg-surface-container p-sm rounded-lg flex items-center space-x-sm col-span-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Active Features</p>
                <p className="font-label-md text-label-md">AI Smart Adjustments Enabled</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="w-full flex flex-col space-y-md">
          <Link to="/discovery" className="w-full bg-primary-container text-on-primary-container font-label-md text-label-md py-4 rounded-full shadow-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex justify-center">
            Go to Discovery
          </Link>
          <Link to="/pantry" className="w-full bg-transparent text-primary font-label-md text-label-md py-4 rounded-full border border-primary hover:bg-primary/5 active:scale-[0.98] transition-all duration-200 flex justify-center">
            View My Pantry
          </Link>
        </div>
      </div>

      {/* Decorative Floating Elements */}
      <div className="absolute top-20 left-10 opacity-20 hidden md:block">
        <span className="material-symbols-outlined text-6xl text-primary">eco</span>
      </div>
      <div className="absolute bottom-20 right-10 opacity-20 hidden md:block">
        <span className="material-symbols-outlined text-6xl text-primary">nutrition</span>
      </div>
    </div>
  );
};

export default OnboardingComplete;
