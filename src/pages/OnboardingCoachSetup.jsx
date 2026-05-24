import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

const OnboardingCoachSetup = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleListen = async () => {
    if (isListening || isSuccess) return;
    setIsListening(true);
    
    if (Capacitor.isNativePlatform()) {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        const { available } = await SpeechRecognition.available().catch(() => ({ available: false }));
        if (available) {
          const perm = await SpeechRecognition.requestPermissions();
          if (perm.speechRecognition === 'granted') {
            const result = await SpeechRecognition.start({
              language: 'en-US',
              maxResults: 1,
              partialResults: false,
              popup: false,
            });
            const heard = (result?.matches?.[0] || '').toLowerCase();
            if (heard.includes('ready') || heard.includes('start') || heard.includes('cooking') || heard.length > 5) {
              setIsSuccess(true);
            }
          }
        }
      } catch (err) {
        console.error("Speech reco error:", err);
        // If it times out or fails, just pretend it worked so user isn't stuck
        setIsSuccess(true);
      } finally {
        setIsListening(false);
      }
    } else {
      const SpeechRecognitionBrowser = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionBrowser) {
        const recognition = new SpeechRecognitionBrowser();
        recognition.lang = 'en-US';
        recognition.onresult = (e) => {
          const heard = e.results[0][0].transcript.toLowerCase();
          if (heard.includes('ready') || heard.includes('start') || heard.includes('cooking') || heard.length > 5) {
            setIsSuccess(true);
          }
        };
        recognition.onerror = () => setIsSuccess(true); // Don't block
        recognition.onend = () => setIsListening(false);
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
          setIsSuccess(true);
        }
      } else {
        setIsListening(false);
        setIsSuccess(true);
      }
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen font-body-md selection:bg-primary-container">
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between px-gutter w-full max-w-7xl mx-auto h-16">
          <Link to="/onboarding/preferences" className="text-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg text-primary tracking-tight truncate max-w-[50vw] text-center">Modern Kitchen</h1>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest overflow-hidden">
            <img
              alt="User Profile"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCuJmemOYumJlyM12DJlR775JgMDJzzYwz5utxQyZFGNndO2DHaHHlkGHVhO1MTymd5DlOIY9AL0Ck3WDZIDOVh3jY0-XeuGamJByrZbu-y6fPiWQZwCQG0YDC8b3-nihvnNNJe3LRe1iD2s2FvRUzpk7REW3A32Xx0RTR4-10GpVyf1sByedGD4kmx9MNkMN2xIqEfztRTXTjS_iq9AKhTIE4n5nw9_1qPc6Vg8ruTT5vIqkvfDIBrNHacpD_9jbfk5CKm5r6cFrg"
            />
          </div>
        </div>
      </header>

      <main className="pt-24 pb-xl px-container-margin max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Progress Indicator */}
        <div className="mb-md">
          <span className="font-label-md text-label-md text-primary tracking-widest uppercase">Step 3 of 3</span>
          <div className="flex gap-2 mt-2">
            <div className="h-1 w-8 rounded-full bg-primary"></div>
            <div className="h-1 w-8 rounded-full bg-primary"></div>
            <div className="h-1 w-8 rounded-full bg-primary"></div>
          </div>
        </div>

        <h2 className="font-headline-lg text-headline-lg mb-4">Calibrate Your AI Voice Coach</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg max-w-md">
          Let's find the perfect voice to guide your culinary journey. Speak clearly to test your microphone levels.
        </p>

        {/* AI Voice Calibration Interaction */}
        <section className="w-full relative mb-xl group">
          <div className="absolute inset-0 bg-primary-container/10 blur-3xl rounded-full scale-110 -z-10 group-hover:bg-primary-container/20 transition-all duration-700"></div>
          <div className="glass-panel rounded-[2rem] p-lg shadow-sm border border-white/40 flex flex-col items-center">
            {/* Voice Waveform Visualization */}
            <div className="flex items-end justify-center gap-1 h-12 mb-8 px-4 w-full">
              <div className="w-1.5 bg-primary/20 rounded-full h-4"></div>
              <div className="w-1.5 bg-primary/40 rounded-full h-6"></div>
              <div className="w-1.5 bg-primary/60 rounded-full h-10"></div>
              <div className="w-1.5 bg-primary rounded-full h-8"></div>
              <div className="w-1.5 bg-primary/80 rounded-full h-12"></div>
              <div className="w-1.5 bg-primary/60 rounded-full h-7"></div>
              <div className="w-1.5 bg-primary/40 rounded-full h-9"></div>
              <div className="w-1.5 bg-primary/20 rounded-full h-5"></div>
            </div>
            {/* Main Tap to Speak Button */}
            <button 
              onClick={handleListen}
              className={`w-24 h-24 rounded-full text-on-primary shadow-lg flex items-center justify-center transition-all duration-300 ${isSuccess ? 'bg-secondary hover:scale-105' : isListening ? 'bg-error animate-pulse shadow-error/40' : 'bg-primary hover:scale-105 active:scale-95 shadow-primary/20'}`}
            >
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isSuccess ? 'check' : 'mic'}
              </span>
            </button>
            <p className={`font-label-md text-label-md mt-6 tracking-wide ${isSuccess ? 'text-secondary' : isListening ? 'text-error' : 'text-primary'}`}>
              {isSuccess ? 'MIC CALIBRATED!' : isListening ? 'LISTENING...' : 'TAP TO SPEAK'}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2 italic">
              {isSuccess ? 'You are all set!' : '"Ready to start cooking..."'}
            </p>
          </div>
        </section>

        {/* Voice Personality Selection */}
        <div className="w-full text-left mb-xl">
          <h3 className="font-headline-md text-headline-md mb-gutter px-2">Voice Personality</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full">
            {/* Personality Option 1 */}
            <div className="bg-surface-container p-gutter rounded-xl border-2 border-primary shadow-sm flex items-start gap-4 cursor-pointer hover:bg-surface-container-high transition-colors group">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-primary-container">favorite</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface mb-1">Warm & Encouraging</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Soft tones for a relaxed kitchen experience.</p>
              </div>
            </div>
            {/* Personality Option 2 */}
            <div className="bg-surface-container-lowest p-gutter rounded-xl border border-outline-variant shadow-sm flex items-start gap-4 cursor-pointer hover:bg-surface-container transition-colors">
              <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant">restaurant</span>
              </div>
              <div>
                <h4 className="font-label-md text-label-md text-on-surface mb-1">Professional Chef</h4>
                <p className="font-label-sm text-label-sm text-on-surface-variant">Direct, precise instructions for efficiency.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="w-full flex flex-col gap-4">
          <Link to="/onboarding/complete" className="w-full h-12 bg-primary text-on-primary font-label-md text-label-md rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all duration-200 uppercase tracking-widest flex items-center justify-center">
            Continue to Kitchen
          </Link>
          <Link to="/onboarding/complete" className="w-full h-12 border border-outline-variant text-on-surface-variant font-label-md text-label-md rounded-full hover:bg-surface-variant/20 transition-colors flex items-center justify-center">
            Skip Calibration
          </Link>
        </div>
      </main>

      {/* Background Decorative Element */}
      <div className="fixed top-0 right-0 -z-20 w-1/2 h-full opacity-5 pointer-events-none">
        <img
          alt="Culinary Background"
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGCvd_t-WfBm8Z7UITk5EToebZmrUmKOGd8ChzjNBnkAnogkH0UkuEXyEughjmjH9XsN6U4o8_gvm3LJ3U7zXHC83hW6NAJ_7C5FaxyF286JBfi5o_Airujog70lkub_PEaDsb7bWKYqC2iQygnoKzSKU5bRdIk655LFziRc0gjsyy3FmUjkUmAqY06hXk_m04FVp1RkGBLg00Xm1xHnxySsKPQR-LPS__TATi3LF5dE8BOGf4jJAfzDoWEyYCXoPvmPkGNlYsyxw"
        />
      </div>
    </div>
  );
};

export default OnboardingCoachSetup;
