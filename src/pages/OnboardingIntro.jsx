import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    icon: 'auto_awesome',
    iconColor: 'text-primary',
    bgColor: 'bg-primary-container',
    title: 'AI Recipe Generation',
    description: 'Tell our AI what ingredients you have and get instant, personalised recipes from cuisines around the world — in seconds.',
    tip: 'Works even with just 3 ingredients!',
  },
  {
    icon: 'inventory_2',
    iconColor: 'text-secondary',
    bgColor: 'bg-secondary-container',
    title: 'Smart Pantry Tracker',
    description: 'Scan or add ingredients to your digital pantry. The app tracks what you have, suggests recipes that match, and alerts you before things expire.',
    tip: 'Never waste food or a grocery trip again.',
  },
  {
    icon: 'family_restroom',
    iconColor: 'text-tertiary',
    bgColor: 'bg-tertiary-container',
    title: 'Family Kitchen Hub',
    description: 'Invite your family, share meal plans, assign cooking roles, and build shared grocery lists — all in one collaborative kitchen space.',
    tip: 'Up to 6 family members on the Feast plan.',
  },
  {
    icon: 'mic',
    iconColor: 'text-primary',
    bgColor: 'bg-primary-container',
    title: 'AI Voice Coach',
    description: 'Cook hands-free with your personal AI culinary coach. Get step-by-step spoken guidance, substitution tips, and timing reminders while you cook.',
    tip: 'Just say "Next step" to continue.',
  },
  {
    icon: 'calendar_month',
    iconColor: 'text-secondary',
    bgColor: 'bg-secondary-container',
    title: 'Weekly Meal Planner',
    description: 'Plan your entire week in minutes. Drag, drop, and customise meals across 7 days — then auto-generate your grocery list with one tap.',
    tip: 'Saves the average family 2 hours a week.',
  },
];

const OnboardingIntro = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      navigate('/onboarding/preferences');
    } else {
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-container-margin py-xl max-w-md mx-auto">
      {/* Skip */}
      <div className="w-full flex justify-end">
        <button
          onClick={() => navigate('/onboarding/preferences')}
          className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center text-center space-y-xl w-full flex-1 justify-center"
        >
          {/* Icon */}
          <div className={`w-28 h-28 rounded-3xl ${current.bgColor} flex items-center justify-center shadow-md`}>
            <span className={`material-symbols-outlined text-5xl ${current.iconColor}`}>{current.icon}</span>
          </div>

          {/* Text */}
          <div className="space-y-md max-w-xs">
            <h1 className="font-display-sm text-on-background leading-tight">{current.title}</h1>
            <p className="font-body-lg text-on-surface-variant">{current.description}</p>
          </div>

          {/* Tip chip */}
          <div className="flex items-center gap-xs bg-surface-container px-md py-sm rounded-full border border-outline-variant/30 shadow-sm">
            <span className="material-symbols-outlined text-base text-primary">lightbulb</span>
            <span className="font-label-sm text-on-surface-variant">{current.tip}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls */}
      <div className="w-full space-y-md">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-primary' : 'w-2 bg-outline-variant'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={goBack}
              className="flex-1 h-14 border border-outline-variant text-on-surface font-label-md rounded-full flex items-center justify-center gap-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back
            </button>
          )}
          <button
            onClick={goNext}
            className="flex-1 h-14 bg-primary text-on-primary font-label-md rounded-full flex items-center justify-center gap-sm shadow-md active:scale-95 transition-all"
          >
            {isLast ? 'Get Started' : 'Next'}
            <span className="material-symbols-outlined text-sm">{isLast ? 'check' : 'arrow_forward'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingIntro;
