import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import { SUPPORTED_CUISINES } from '../constants/cuisines';

const OnboardingPreferences = () => {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAppStore();
  
  const [selectedCuisines, setSelectedCuisines] = useState(userProfile?.cuisines || ['Mexican']);
  const [selectedRestrictions, setSelectedRestrictions] = useState(userProfile?.dietaryRestrictions || ['Gluten-Free']);
  const [searchQuery, setSearchQuery] = useState('');

  const trendingCuisines = [
    { name: 'Japanese', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvdb2laQCCGU5jxelBfFj0oGCsnyEsPJkv-EkFOYiRkRzQ8HvipzcHsJEIKmQF_fos3aQgTlpSrBT-xRI_qRFCTGzyn994vrcmjF9vGwn9_Yw_fsUKj6CIyUtxaQ0b8gGgasnR1EgBdbxNVpDqPpBVIh3CmnQg9EWjNj4TcQeAurUhTiVS5XUMKnoovfqXS0LqL633AQ3YIVE8ZkSfNiDJTcJx2N3OWKL9hDTB-S1GInf5ssMCg9z128tr-zX7-YLxvO1viHRkxJ8' },
    { name: 'Mexican', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB7Z9qDAte4pBZqxTQZDp2an6jAkVJY-16Nac-TroCJphunZxn20lQpSZE_uDMpzfgaUaAF_IdizBeykfM0FdnZyH81h-4ctC0U1QaHSexvejKiacltl24Un81TLPw0PL6FgEM0CqVJUF_HQcAJcXRlyNiho4AmCqythuo3UBPgqSJPAhVNaSA5syktO9l2sJvGRuq-yPoQtJEfhPDzLoUHvkKK7GEKvapXKOR3GP4U7Nn73Jpe4xPv9aXD2RFYyiiFlcaOLNzIC1Q' },
    { name: 'Ethiopian', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcOOxQz6bVRHVc-MquTLRNueMMICIAKPUcDwS5T3yp7a3h6jkbds2UoqhZU7POQV2gGVyt3TZ0BXUgBP-WfwHQEuX5P46T5yTxA87UvBu2jUOdH9R4M2Bi-UBgJA48gLnzmBwso26rjsqcIyoTFYuhe3V05finOkvfQraq0To3JzlyAuG0_PEjRGTt-bgh6I0AWTjPZNEFKhO11-TsHeuMGcNGAJgkOqPHeLfQQ7KH-kDDkj9JTPkox652EuSW42aQd1fqIctE1JI' },
    { name: 'Italian', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsqvsi_Mnzrzm_4xzxs0OYzwjtOF-3CBlxZYCRNIWc1qp5_aX-5obF8JD18cidiA6WdXa677iraS9kMCh1ncE-RWRrJBkavmV5mv9ITQwPaUh_qwzcBdkh67GenTiZ98UDbJ3KHAUt5Sb1DWuMIuJMM7oQufyv1JYh50DOZDiLsbv-JnJG2vhgEx-_HgAUVJRPv-CXvQ0t-Ad3v37dBJkgDz6zwxSHYxe4P_WmGem2tkXMXvx3Il8JEccx4zSwGv7uBt9y7okhYOA' }
  ];

  const dietaryOptions = ['Vegan', 'Gluten-Free', 'Nut Allergy', 'Keto', 'Halal', 'Kosher', 'Dairy-Free'];

  const toggleCuisine = (name) => {
    setSelectedCuisines(prev => 
      prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]
    );
  };

  const activePlan = useAppStore(state => state.activePlan);
  const [showPreferenceUpgradeLock, setShowPreferenceUpgradeLock] = useState(false);

  const toggleRestriction = (name) => {
    setSelectedRestrictions(prev => {
      if (prev.includes(name)) {
        return prev.filter(r => r !== name);
      }
      if (activePlan === 'Taste' && prev.length >= 1) {
        setShowPreferenceUpgradeLock(true);
        return prev;
      }
      return [...prev, name];
    });
  };

  const handleContinue = () => {
    updateUserProfile({
      cuisines: selectedCuisines,
      dietaryRestrictions: selectedRestrictions
    });
    navigate('/onboarding/coach');
  };

  const filteredCuisines = SUPPORTED_CUISINES.filter(c => 
    c.toLowerCase().includes(searchQuery.toLowerCase()) && 
    !trendingCuisines.some(t => t.name === c)
  ).slice(0, 8);

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-md">
      {/* Custom TopAppBar for Preferences */}
      <header className="bg-surface dark:bg-inverse-surface flex justify-between items-center w-full px-container-margin py-base max-w-7xl mx-auto sticky top-0 z-50">
        <div className="flex items-center gap-md">
          <Link to="/" className="text-primary dark:text-primary-fixed-dim hover:text-primary dark:hover:text-primary-fixed-dim transition-colors active:scale-95 transition-transform duration-150">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
          </Link>
          <h1 className="font-headline-md text-primary dark:text-inverse-primary">Global Kitchen</h1>
        </div>
        <div className="flex items-center gap-md">
          <button onClick={handleContinue} className="font-label-md text-label-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors">Skip</button>
        </div>
      </header>

      <main className="flex-grow max-w-3xl mx-auto w-full px-container-margin py-lg">
        {/* Progress Indicator */}
        <div className="mb-lg">
          <div className="flex justify-between items-end mb-base">
            <span className="font-label-md text-label-md text-primary">Step 2 of 3</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Taste Profile</span>
          </div>
          <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-2/3 transition-all duration-500"></div>
          </div>
        </div>

        <section className="mb-xl">
          <h2 className="font-headline-lg text-headline-lg mb-base">Tailor your kitchen.</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mb-md">Select your favorite cuisines to help our AI Chef suggest the perfect recipes for your palate.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter mb-xl">
            {trendingCuisines.map((cuisine) => {
              const isSelected = selectedCuisines.includes(cuisine.name);
              return (
                <div 
                  key={cuisine.name}
                  onClick={() => toggleCuisine(cuisine.name)}
                  className={`group relative aspect-[3/4] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(26,25,21,0.04)] cursor-pointer hover:shadow-lg transition-all border-2 ${isSelected ? 'border-primary-container ring-2 ring-primary-container/20' : 'border-transparent hover:border-primary-container'}`}
                >
                  <img
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={`${cuisine.name} Cuisine`}
                    src={cuisine.img}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-md left-md right-md">
                    <p className="font-headline-md text-white">{cuisine.name}</p>
                  </div>
                  <div className={`absolute top-sm right-sm transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="material-symbols-outlined text-primary-container" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-xl">
          <h3 className="font-headline-md text-headline-md mb-md">Explore More Cuisines</h3>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 70+ global cuisines..."
              className="w-full bg-surface-container-low border-2 border-transparent rounded-full py-4 pl-12 pr-6 text-body-md focus:bg-surface focus:border-primary-container focus:ring-4 focus:ring-primary-container/10 transition-all outline-none"
            />
          </div>
          {searchQuery && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filteredCuisines.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`px-4 py-2 rounded-full border transition-all ${selectedCuisines.includes(c) ? 'bg-primary-container border-primary-container text-on-primary-container' : 'border-outline-variant hover:border-primary'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mb-lg">
          <h3 className="font-headline-md text-headline-md mb-md">Dietary Restrictions</h3>
          <div className="flex flex-wrap gap-sm">
            {dietaryOptions.map((restriction) => {
              const isSelected = selectedRestrictions.includes(restriction);
              const icons = {
                'Vegan': 'eco',
                'Gluten-Free': 'check',
                'Nut Allergy': 'warning',
                'Keto': 'fitness_center',
                'Halal': 'star_half',
                'Kosher': 'verified',
                'Dairy-Free': 'opacity'
              };
              return (
                <button 
                  key={restriction}
                  onClick={() => toggleRestriction(restriction)}
                  className={`flex items-center gap-xs px-md py-sm rounded-full border transition-all ${isSelected ? 'bg-secondary-container border-secondary-container text-on-secondary-container shadow-sm' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">{isSelected ? 'check' : (icons[restriction] || 'info')}</span>
                  {restriction}
                </button>
              );
            })}
          </div>
        </section>

        {/* Glassmorphism AI Tip Card */}
        <div className="glass-panel mt-xl p-md rounded-xl border border-white/40 shadow-sm flex items-start gap-md">
          <div className="p-base bg-primary-container rounded-lg">
            <span className="material-symbols-outlined text-on-primary-container">auto_awesome</span>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-primary-container mb-xs">AI Tip</p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {selectedRestrictions.length > 0 
                ? `I'll prioritize recipes that are ${selectedRestrictions.join(' and ')} in your personalized feed.`
                : 'Selecting your dietary needs helps me filter out recipes that might not be right for you.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer Action */}
      <footer className="sticky bottom-0 w-full bg-surface/80 backdrop-blur-xl py-md px-container-margin z-50">
        <div className="max-w-3xl mx-auto">
          <button 
            onClick={handleContinue}
            className="w-full bg-primary text-on-primary h-[56px] rounded-full font-label-md text-label-md hover:bg-primary/90 transition-all shadow-md active:scale-95 duration-150 flex items-center justify-center gap-sm"
          >
            Continue
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </footer>

      {showPreferenceUpgradeLock && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-md">
          <div className="bg-surface-container-high rounded-2xl p-6 max-w-sm w-full text-center border border-outline-variant/30 shadow-2xl">
            <span className="material-symbols-outlined text-primary text-4xl mb-4 animate-bounce">lock</span>
            <h4 className="font-headline-md text-headline-md mb-2">Upgrade to Stack Preferences</h4>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Under our <strong>Taste (Free)</strong> plan, you can only set 1 active dietary restriction. Upgrade to <strong>Savor</strong> or <strong>Feast</strong> to stack multiple preferences & allergies!
            </p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setShowPreferenceUpgradeLock(false)}
                className="px-4 py-2 border border-outline-variant rounded-full font-label-md hover:bg-surface-container-highest transition-all"
              >
                Maybe Later
              </button>
              <Link 
                to="/settings" 
                state={{ tab: 'subscription' }}
                className="px-5 py-2 bg-primary text-on-primary rounded-full font-label-md hover:scale-105 transition-transform active:scale-95 shadow-sm"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPreferences;
