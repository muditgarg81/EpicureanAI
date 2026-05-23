import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import useTranslation from '../hooks/useTranslation';
import { Capacitor } from '@capacitor/core';

const AiVoiceCoach = () => {
  const activePlan = useAppStore(state => state.activePlan);
  const location = useLocation();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  if (activePlan !== 'Feast') {
    return (
      <div className="pt-24 px-container-margin max-w-xl mx-auto text-center min-h-[80vh] flex flex-col justify-center items-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-primary text-4xl animate-pulse">lock</span>
        </div>
        <h2 className="font-display-md text-display-md mb-4 text-on-surface">Feast Tier Feature Only</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-8 max-w-md">
          The interactive step-by-step <strong>AI Voice Coach</strong> is exclusive to our <strong>Feast</strong> tier subscribers. Upgrade to get instant hands-free cooking guides, family hubs, and more!
        </p>
        <Link 
          to="/settings" 
          state={{ tab: 'subscription' }}
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-label-lg hover:scale-105 transition-transform active:scale-95 shadow-md"
        >
          Upgrade to Feast
        </Link>
      </div>
    );
  }

  const recipe = location.state?.recipe || {
    title: "Gourmet Dish",
    instructions: ["No instructions found for this recipe."],
    ingredients: []
  };

  let steps = recipe.instructions || recipe.steps || [];
  if (steps.length === 0) {
    steps = ["No instructions found for this recipe."];
  }
  const ingredients = recipe.ingredients || [];

  // Warm up voices on mount to ensure SpeechSynthesis functions on mobile webviews/hybrid apps
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
  }, []);

  const webSpeak = useCallback((cleanText) => {
    if ('speechSynthesis' in window && cleanText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      
      let voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        voices = window.speechSynthesis.getVoices();
      }
      
      if (voices && voices.length > 0) {
        const enVoice = voices.find(v => 
          v.lang.toLowerCase().includes('en-us') || 
          v.lang.toLowerCase().includes('en-gb') || 
          v.lang.toLowerCase().startsWith('en')
        );
        if (enVoice) {
          utterance.voice = enVoice;
        } else {
          utterance.voice = voices[0];
        }
      }
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const speak = useCallback(async (text) => {
    if (!text) return;
    const cleanText = text.replace(/\*\*|#/g, '');
    
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop().catch(() => {});
        await TextToSpeech.speak({
          text: cleanText,
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient'
        });
      } catch (err) {
        console.error("Native Speech failed, falling back to Web Speech:", err);
        webSpeak(cleanText);
      }
    } else {
      webSpeak(cleanText);
    }
  }, [webSpeak]);

  const cancelSpeech = useCallback(async () => {
    const isNative = Capacitor.isNativePlatform();
    if (isNative) {
      try {
        const { TextToSpeech } = await import('@capacitor-community/text-to-speech');
        await TextToSpeech.stop().catch(() => {});
      } catch (err) {
        console.error("Failed to stop native speech:", err);
      }
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const navigateToStep = useCallback((stepIndex) => {
    setCurrentStep(stepIndex);
    if (!isPaused && steps[stepIndex]) {
      speak(steps[stepIndex]);
    }
  }, [steps, isPaused, speak]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      navigateToStep(currentStep + 1);
    } else {
      speak(t('completion_msg'));
    }
  }, [currentStep, steps.length, navigateToStep, speak, t]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      navigateToStep(currentStep - 1);
    }
  }, [currentStep, navigateToStep]);

  // Native speech recognition (Capacitor) — works on Android/iOS
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (isPaused) return;

    let active = true;

    const runNativeListeningLoop = async () => {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

        // Check availability
        const { available } = await SpeechRecognition.available().catch(() => ({ available: false }));
        if (!available) return;

        // Request permission
        const perm = await SpeechRecognition.requestPermissions().catch(() => ({ speechRecognition: 'denied' }));
        if (perm?.speechRecognition !== 'granted') return;

        // Continuous listening loop — start() resolves with { matches } after each utterance
        while (active) {
          try {
            const result = await SpeechRecognition.start({
              language: 'en-US',
              maxResults: 1,
              partialResults: false,
              popup: false,
            });

            if (!active) break;

            const transcript = (result?.matches?.[0] || '').toLowerCase().trim();
            console.log('[VoiceCoach] Heard:', transcript);

            if (transcript.includes('next')) {
              handleNext();
            } else if (transcript.includes('back') || transcript.includes('previous')) {
              handleBack();
            } else if (transcript.includes('repeat') || transcript.includes('again')) {
              if (steps[currentStep]) speak(steps[currentStep]);
            } else if (transcript.includes('pause') || transcript.includes('stop')) {
              setIsPaused(true);
              break;
            }
          } catch (innerErr) {
            // start() rejects when stop() is called externally — this is expected cleanup
            break;
          }
        }
      } catch (err) {
        console.warn('[VoiceCoach] Native speech recognition unavailable:', err.message);
      }
    };

    runNativeListeningLoop();

    return () => {
      active = false;
      import('@capacitor-community/speech-recognition')
        .then(({ SpeechRecognition }) => SpeechRecognition.stop().catch(() => {}))
        .catch(() => {});
    };
  }, [isPaused, handleNext, handleBack, currentStep, speak, steps]);


  // Web speech recognition — only for browser (non-native)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (transcript.includes('next')) {
        handleNext();
      } else if (transcript.includes('back') || transcript.includes('previous')) {
        handleBack();
      } else if (transcript.includes('repeat')) {
        if (steps[currentStep]) speak(steps[currentStep]);
      } else if (transcript.includes('pause') || transcript.includes('stop')) {
        setIsPaused(true);
      }
    };

    if (!isPaused) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Speech recognition already started or blocked");
      }
    }

    return () => {
      try { recognition.stop(); } catch (e) {}
    };
  }, [isPaused, handleNext, handleBack, currentStep, speak, steps]);


  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  // Initialize timer when step changes
  useEffect(() => {
    const timeMatch = steps[currentStep]?.match(/(\d+)\s*min/i);
    if (timeMatch) {
      const mins = parseInt(timeMatch[1]);
      setTimeLeft(mins * 60);
      setTotalTime(mins * 60);
      setTimerActive(false);
    } else {
      setTimeLeft(0);
      setTimerActive(false);
    }
  }, [currentStep, steps]);

  // Countdown logic
  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      speak(t('timer_finished'));
      // Pulse the whole screen or play a sound in a real app
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, speak, t]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (timeLeft > 0) {
      setTimerActive(!timerActive);
    }
  };

  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, [cancelSpeech]);

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-fixed-dim">
      {/* TopAppBar Shell */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-16 bg-surface/80 backdrop-blur-md shadow-sm">
        <Link to="/generator" className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ease-in-out active:scale-95 hover:bg-surface-variant/50 cursor-pointer">
          <span className="material-symbols-outlined text-primary">close</span>
        </Link>
        <h1 className="font-headline-md text-headline-md text-primary font-semibold">{t('voice_coach')}</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ease-in-out active:scale-95 hover:bg-surface-variant/50">
          <span className="material-symbols-outlined text-primary">settings</span>
        </button>
      </header>

      <main className="flex-grow pt-24 pb-32 px-container-margin max-w-lg mx-auto w-full flex flex-col items-center gap-8">
        {/* Voice Activity Header */}
        <section className="w-full flex flex-col items-center justify-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 bg-primary-container rounded-full blur-2xl opacity-40 animate-pulse"></div>
            <div className="relative w-16 h-16 bg-gradient-to-tr from-primary to-primary-container rounded-full flex items-center justify-center orb-glow shadow-lg">
              <div className="flex items-end gap-1 h-8">
                <div className="waveform-bar w-1 bg-on-primary-container rounded-full" style={{ animationDelay: '0s' }}></div>
                <div className="waveform-bar w-1 bg-on-primary-container rounded-full" style={{ animationDelay: '0.2s' }}></div>
                <div className="waveform-bar w-1 bg-on-primary-container rounded-full" style={{ animationDelay: '0.4s' }}></div>
                <div className="waveform-bar w-1 bg-on-primary-container rounded-full" style={{ animationDelay: '0.1s' }}></div>
                <div className="waveform-bar w-1 bg-on-primary-container rounded-full" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant tracking-wider">{t('listening_for')} <span className="text-primary font-bold">"Next Step"</span>...</p>
        </section>

        {/* Current Step Card & Timer Layout */}
        <div className="w-full relative">
          {/* Step Card */}
          <div className="bg-surface shadow-[0_12px_24px_-10px_rgba(26,25,21,0.08)] rounded-[32px] p-10 border border-outline-variant/20 flex flex-col items-start gap-6 min-h-[380px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary-container"></div>
            <span className="bg-primary-container/20 text-on-primary-container px-4 py-1 rounded-full font-label-sm text-label-sm uppercase tracking-widest">
              {t('instruction')} {currentStep + 1} {t('of')} {steps.length}
            </span>
            <div className="w-full">
              {(steps[currentStep] || '').split('\n').map((line, i) => {
                // Simple parsing for **Bold Text** and regular text
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <p key={i} className="font-body-lg text-body-lg text-on-surface leading-relaxed mb-4 last:mb-0">
                    {parts.map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j} className="font-headline-md text-primary block mb-2">{part.replace(/\*\*/g, '')}</strong>;
                      }
                      return part;
                    })}
                  </p>
                );
              })}
            </div>
            {/* Timer Overlay (Contextual - only show if step mentions time) */}
            {timeLeft > 0 && (
              <div 
                className="mt-4 flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-500 cursor-pointer group"
                onClick={toggleTimer}
              >
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle className="text-outline-variant/20" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="4"></circle>
                    <circle 
                      className="text-primary transition-all duration-1000 ease-linear" 
                      cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" 
                      strokeDasharray="364" 
                      strokeDashoffset={364 * (1 - timeLeft / totalTime)} 
                      strokeWidth="4"
                    ></circle>
                  </svg>
                  <div className="text-center group-hover:scale-110 transition-transform">
                    <span className="block font-headline-md text-headline-md text-primary">
                      {formatTime(timeLeft)}
                    </span>
                    <span className="block font-label-sm text-label-sm text-on-surface-variant uppercase">
                      {timerActive ? 'Pause' : 'Start'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Side Floating Ingredient View (Glassmorphism) - Moved to side to avoid overlap */}
          <div className="fixed top-24 right-gutter hidden lg:flex glass-panel border border-white/60 shadow-2xl rounded-3xl p-6 w-72 z-10 flex-col gap-4 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-primary">{t('next_items')}</span>
              <span className="material-symbols-outlined text-[24px] text-on-surface-variant">shopping_basket</span>
            </div>
            <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5">check_circle</span>
                  <span className="text-body-md font-medium leading-tight">{ing}</span>
                </li>
              ))}
              {ingredients.length === 0 && <li className="text-body-sm text-on-surface-variant italic">Check main recipe view</li>}
            </ul>
          </div>

          {/* Mobile version - lower down and centered below the card */}
          <div className="lg:hidden mt-8 w-full glass-panel border border-white/60 shadow-xl rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-primary">{t('next_items')}</span>
              <span className="material-symbols-outlined text-[24px] text-on-surface-variant">shopping_basket</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
              {ingredients.map((ing, idx) => (
                <li key={idx} className="flex items-start gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5">check_circle</span>
                  <span className="text-body-md font-medium leading-tight">{ing}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recipe Visual Reference */}
        <div className="w-full mt-4">
          <div className="rounded-2xl overflow-hidden shadow-sm h-40 relative group">
            <img
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={recipe.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
              <p className="text-white font-label-md text-label-md drop-shadow-md">{t('visual_ref')}: {recipe.title}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Hands-Free Navigation / Controls */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center bg-surface/95 dark:bg-on-surface/95 backdrop-blur-lg pb-safe pt-4 px-gutter h-24">
        <button 
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`flex flex-col items-center justify-center gap-1 transition-transform duration-200 active:scale-90 group ${currentStep === 0 ? 'opacity-30 cursor-not-allowed' : 'text-on-surface-variant'}`}
        >
          <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center group-hover:bg-surface-variant">
            <span className="material-symbols-outlined">arrow_back</span>
          </div>
          <span className="font-label-sm text-label-sm">{t('back')}</span>
        </button>
        <button 
          onClick={() => {
            const newPaused = !isPaused;
            setIsPaused(newPaused);
            if (newPaused) {
              cancelSpeech();
            } else if (steps[currentStep]) {
              speak(steps[currentStep]);
            }
          }}
          className="flex flex-col items-center justify-center gap-1 transition-transform duration-200 active:scale-90 text-on-primary-container"
        >
          <div className="w-16 h-16 rounded-full bg-primary-container shadow-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </div>
          <span className="font-label-sm text-label-sm font-bold">{isPaused ? t('resume_ai') : t('pause_ai')}</span>
        </button>
        <button 
          onClick={handleNext}
          className="flex flex-col items-center justify-center gap-1 transition-transform duration-200 active:scale-90 text-on-surface-variant group"
        >
          <div className="w-12 h-12 rounded-full border border-outline-variant flex items-center justify-center group-hover:bg-surface-variant">
            <span className="material-symbols-outlined">arrow_forward</span>
          </div>
          <span className="font-label-sm text-label-sm">{t('next')}</span>
        </button>
      </footer>
    </div>
  );
};

export default AiVoiceCoach;
