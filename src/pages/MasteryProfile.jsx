import React from 'react';
import useAuthStore from '../store/useAuthStore';
import useAppStore from '../store/useAppStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MasteryProfile = () => {
  const { user, signOut, updateProfile } = useAuthStore();
  const activePlan = useAppStore(state => state.activePlan);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = React.useState(false);
  const [name, setName] = React.useState(user?.user_metadata?.full_name || '');

  const badges = [
    { id: 1, name: 'Taco Titan', desc: 'Mastered 10+ Salsas', requirement: 'Cook 10 Mexican salsa recipes.', icon: 'restaurant', status: 'earned', current: 10, target: 10 },
    { id: 2, name: 'Sushi Sensei', desc: 'Nigiri Perfection', requirement: 'Log 5 Japanese sushi preparation sessions.', icon: 'set_meal', status: 'earned', current: 5, target: 5 },
    { id: 3, name: 'Wok Warrior', desc: 'High-Heat Master', requirement: 'Master 5 high-heat stir-fry recipes.', icon: 'local_fire_department', status: 'earned', current: 5, target: 5 },
    { id: 4, name: 'Dough Doctor', desc: 'Sourdough Specialist', requirement: 'Bake and log 3 sourdough loaves.', icon: 'bakery_dining', status: 'earned', current: 3, target: 3 },
    { id: 5, name: 'Spice Merchant', desc: 'Moroccan Spice Master', requirement: 'Cook 5 authentic Moroccan dishes.', icon: 'skillet', status: 'progress', current: 3, target: 5 },
    { id: 6, name: 'Curry Connoisseur', desc: 'Indian Gravy Guru', requirement: 'Cook 4 complex Indian curries.', icon: 'dinner_dining', status: 'progress', current: 1, target: 4 },
    { id: 7, name: 'Fromage Fanatic', desc: 'Cheese Pairing Prodigy', requirement: 'Complete the French cheese masterclass.', icon: 'flatware', status: 'locked', current: 0, target: 1 },
    { id: 8, name: 'Michelin Aspirant', desc: 'Fine Dining Master', requirement: 'Unlock and complete 10 advanced 5-star recipes.', icon: 'stars', status: 'locked', current: 0, target: 10 }
  ];

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateProfile({ full_name: name });
    setIsEditing(false);
    alert('Profile updated successfully!');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleChangePassword = () => {
    alert('Password reset link sent to your email!');
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-24 mt-16">
      <main className="max-w-[1280px] mx-auto px-container-margin pt-base">
        {/* Hero Section: Mastery Level */}
        <section className="py-md md:py-lg">
          <div className="relative overflow-hidden rounded-xl aspect-[16/9] md:aspect-[21/9] flex items-end p-md md:p-lg bg-surface-container">
            <img
              alt="Global Culinary Exploration"
              className="absolute inset-0 w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTICue4aKZDfxew3l-P1QNvcLKHK585L9nmZ9R-GI2J_D7YFxx1DZ25yWotayE4Jo6Y15WUGKXkxoSrooMW5EuU8FRblUGpL4WXjhyBo7u7dE8fJh4C84B4vKxQw-0LjVN594HRZP_HnQnBfjutv0AhwLRrkE1fpRWPHHXBo65FiR16WYg7A3GpeQngWTeVuRHhXZojdFZvemtb11zbs3B22xpHMkDa-NN1eB-4Muy6X5T2xXAYeztXxfPvZhSQrQbMMlBUpMcxqM"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="relative z-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-md">
              <div className="flex-1">
                <span className="inline-block px-3 py-1 mb-2 rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm uppercase tracking-widest">Mastery Level</span>
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="flex flex-col gap-2 max-w-sm">
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="bg-white/20 border border-white/40 rounded px-3 py-2 text-white font-display-lg"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="bg-primary text-on-primary px-4 py-1 rounded-full text-label-sm">Save</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="text-white text-label-sm">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <h2 className="font-display-lg text-display-lg text-white text-shadow-sm">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Apprentice Chef'}
                    </h2>
                    <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><span className="material-icons text-[18px]">edit</span></button>
                  </div>
                )}
                <p className="font-body-lg text-body-lg text-white/90 mt-2 max-w-md">
                  Account: {user?.email}
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleChangePassword}
                  className="bg-white/20 text-white px-4 py-3 rounded-full font-label-md text-label-md flex items-center gap-2 active:scale-95 transition-transform hover:bg-white/30"
                >
                  <span className="material-icons">key</span>
                  Security
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-error-container text-on-error-container px-6 py-3 rounded-full font-label-md text-label-md flex items-center gap-2 active:scale-95 transition-transform hover:bg-error-container/90"
                >
                  <span className="material-icons">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid: Progress & Map */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-md pb-xl">
          {/* Global Map Visualization (Large) */}
          <div className="md:col-span-8 bg-surface-container rounded-xl p-md shadow-[0_12px_24px_rgba(26,25,21,0.04)] overflow-hidden">
            <div className="flex justify-between items-center mb-md">
              <h3 className="font-headline-md text-headline-md text-on-surface">Global Footprint</h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-secondary-container/30 text-on-secondary-container font-label-sm text-label-sm">14 Regions Explored</span>
              </div>
            </div>
            <div className="relative w-full aspect-video bg-surface-container-high rounded-lg overflow-hidden border border-outline-variant">
              {/* Placeholder for Map Visualization */}
              <img
                alt="Global Map"
                className="w-full h-full object-cover opacity-50 grayscale"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBekNxW21q2AY2_YKNxYfbDcHfFowJyDyO-RbKntuT8t7zUNFP3Wr3P7INC13ms_x4xO-u0Tt-4i6lAhfBFEMyupiB-9nhih_jFJ-nL9WSGi9XHxcqkGJZZH2F-_R7XXfMTEduQmb-W-aeTo00IGHgKyW_VUiVbSOSPQgRD2xcp_XCzNb8JyeEvbl8v1s8307OuOr-sH6meoytB5wiPAl9o5s31Evhyw_ty3AC7HEzThPLwwjXig7CWmH3Sczo_8uSqx8FdIL2Oq54"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-panel p-md rounded-xl text-center border border-white/40">
                  <span className="material-icons text-primary text-4xl block mb-2">public</span>
                  <p className="font-label-md text-label-md text-on-surface">Interactive Map Active</p>
                  <p className="text-[10px] uppercase tracking-tighter text-outline mt-1">Tap markers to view regional dishes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col gap-md">
            <div className="bg-surface-container rounded-xl p-md shadow-sm border border-primary/20">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-label-md text-label-md text-on-surface">Active Plan</h4>
                  <p className="font-headline-md text-headline-md text-primary">{activePlan}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] rounded uppercase font-bold ${
                  activePlan === 'Taste' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'
                }`}>
                  {activePlan === 'Taste' ? 'Free' : 'Premium'}
                </span>
              </div>
              <p className="text-label-sm text-on-surface-variant mb-4">
                {activePlan === 'Taste' 
                  ? 'Daily limits are active. Upgrade to unlock unlimited recipe generation!' 
                  : activePlan === 'Savor'
                  ? 'You have unlimited recipes & scans, smart pantry tracking, and stacked preferences!'
                  : 'You have Feast Ultimate: full family accounts, Apple Health sync, and voice coach!'}
              </p>
              <Link 
                to="/settings" 
                state={{ tab: 'subscription' }}
                className="w-full py-2 bg-primary text-on-primary rounded-full text-center font-label-md text-label-md block hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                {activePlan === 'Taste' ? 'Upgrade Plan' : 'Manage Subscription'}
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-md flex-1">
              <div className="bg-surface-container rounded-xl p-md flex flex-col items-center justify-center text-center shadow-sm">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-outline-variant" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                    <circle className="text-primary" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset="35.2" strokeWidth="4"></circle>
                  </svg>
                  <span className="absolute font-label-sm text-label-sm">80%</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">Mexican</span>
              </div>
              <div className="bg-surface-container rounded-xl p-md flex flex-col items-center justify-center text-center shadow-sm">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle className="text-outline-variant" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="4"></circle>
                    <circle className="text-secondary" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeDasharray="175.9" strokeDashoffset="105.5" strokeWidth="4"></circle>
                  </svg>
                  <span className="absolute font-label-sm text-label-sm">40%</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface">Japanese</span>
              </div>
            </div>
          </div>
        </section>

        {/* Badges Earned Section */}
        <section className="pb-xl">
          <div className="flex items-end justify-between mb-md">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Badges Earned</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">Your culinary milestones and titles.</p>
            </div>
            <button 
              onClick={() => setIsGalleryOpen(true)}
              className="font-label-md text-label-md text-primary flex items-center gap-1 hover:opacity-80 transition-opacity active:scale-95"
            >
              View Gallery <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </div>
          <div className="flex overflow-x-auto gap-md pb-4 hide-scrollbar">
            {/* Badge 1 */}
            <div className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-primary-container/20 flex items-center justify-center mb-3">
                <span className="material-icons text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
              </div>
              <h4 className="font-label-md text-label-md text-on-surface">Taco Titan</h4>
              <p className="text-[10px] text-outline mt-1 uppercase">Mastered 10+ Salsas</p>
            </div>
            {/* Badge 2 */}
            <div className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-secondary-container/20 flex items-center justify-center mb-3">
                <span className="material-icons text-4xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>set_meal</span>
              </div>
              <h4 className="font-label-md text-label-md text-on-surface">Sushi Sensei</h4>
              <p className="text-[10px] text-outline mt-1 uppercase">Nigiri Perfection</p>
            </div>
            {/* Badge 3 */}
            <div className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-3">
                <span className="material-icons text-4xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              </div>
              <h4 className="font-label-md text-label-md text-on-surface">Wok Warrior</h4>
              <p className="text-[10px] text-outline mt-1 uppercase">High-Heat Master</p>
            </div>
            {/* Badge 4 */}
            <div className="flex-shrink-0 w-40 bg-surface-container-low rounded-xl p-md border border-outline-variant/30 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-on-secondary-container/10 flex items-center justify-center mb-3">
                <span className="material-icons text-4xl text-on-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>bakery_dining</span>
              </div>
              <h4 className="font-label-md text-label-md text-on-surface">Dough Doctor</h4>
              <p className="text-[10px] text-outline mt-1 uppercase">Sourdough Specialist</p>
            </div>
          </div>
        </section>

        {/* Skills Section */}
        <section className="pb-xl">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">Culinary Skills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {/* Skill Item */}
            <div className="glass-panel rounded-xl p-md flex items-start gap-4 border border-outline-variant/20 shadow-sm bg-surface/50">
              <div className="bg-primary-container/20 p-2 rounded-lg">
                <span className="material-icons text-primary">skillet</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-label-md text-label-md text-on-surface">Knife Skills</h4>
                  <span className="font-label-sm text-label-sm text-primary">Level 8</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '82%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-outline mt-2">Precision julienne and chiffonade.</p>
              </div>
            </div>

            {/* Skill Item */}
            <div className="glass-panel rounded-xl p-md flex items-start gap-4 border border-outline-variant/20 shadow-sm bg-surface/50">
              <div className="bg-secondary-container/20 p-2 rounded-lg">
                <span className="material-icons text-secondary">science</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-label-md text-label-md text-on-surface">Fermentation</h4>
                  <span className="font-label-sm text-label-sm text-secondary">Level 5</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: '55%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-outline mt-2">Active sourdough and kimchi batches.</p>
              </div>
            </div>

            {/* Skill Item */}
            <div className="glass-panel rounded-xl p-md flex items-start gap-4 border border-outline-variant/20 shadow-sm bg-surface/50">
              <div className="bg-tertiary-container/20 p-2 rounded-lg">
                <span className="material-icons text-tertiary">blender</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-label-md text-label-md text-on-surface">Sauce Mastery</h4>
                  <span className="font-label-sm text-label-sm text-tertiary">Level 9</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: '90%' }}></div>
                </div>
                <p className="font-label-sm text-label-sm text-outline mt-2">Perfecting the five French mothers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA: Next Challenge */}
        <section className="mb-lg">
          <div className="bg-inverse-surface rounded-xl p-md md:p-lg flex flex-col md:flex-row items-center justify-between gap-md">
            <div className="text-center md:text-left">
              <h3 className="font-headline-md text-headline-md text-inverse-on-surface">Ready for your next challenge?</h3>
              <p className="font-body-md text-body-md text-outline-variant">Unlock the 'Moroccan Spice Merchant' title by mastering three tagine recipes.</p>
            </div>
            <button 
              onClick={() => navigate('/generator', { state: { cuisine: 'Moroccan', initialQuery: 'Classic Lamb Tagine with Prunes' } })}
              className="bg-primary text-on-primary px-lg h-12 rounded-full font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all"
            >
              Start Challenge
            </button>
          </div>
        </section>
      </main>

      {/* Premium Badge Gallery Modal */}
      <AnimatePresence>
        {isGalleryOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGalleryOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-surface-container-high p-8 rounded-[3rem] shadow-2xl border border-outline-variant/30 overflow-hidden max-h-[85vh] flex flex-col z-50"
            >
              <button 
                onClick={() => setIsGalleryOpen(false)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-surface-variant/20 flex items-center justify-center hover:bg-surface-variant/40 transition-colors z-10"
              >
                <span className="material-icons">close</span>
              </button>

              <div className="mb-6">
                <span className="inline-flex items-center gap-1 bg-primary text-on-primary px-3 py-1 rounded-full text-label-sm font-label-sm mb-2 shadow-sm">
                  <span className="material-icons !text-sm">star</span>
                  Culinary Achievements
                </span>
                <h3 className="font-display-md text-display-md text-on-surface">Badge Gallery</h3>
                <p className="text-on-surface-variant mt-1 text-body-md">
                  Track your mastery titles, active challenges, and locked culinary accolades.
                </p>
              </div>

              {/* Badges Grid Scroll Container */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 mt-4">
                {badges.map((badge, idx) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`p-6 rounded-[2rem] border flex flex-col items-center text-center relative overflow-hidden transition-all min-h-[220px] justify-between ${
                      badge.status === 'earned' 
                        ? 'bg-emerald-50/30 border-emerald-100'
                        : badge.status === 'progress'
                        ? 'bg-amber-50/30 border-amber-100'
                        : 'bg-slate-50/30 border-slate-100 opacity-60'
                    }`}
                  >
                    {/* Status Badge Tag */}
                    <div className="w-full flex justify-start mb-2">
                      <span className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold shadow-sm ${
                        badge.status === 'earned'
                          ? 'bg-emerald-500 text-white'
                          : badge.status === 'progress'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-400 text-white'
                      }`}>
                        {badge.status}
                      </span>
                    </div>

                    {/* Badge Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-sm ${
                      badge.status === 'earned'
                        ? 'bg-emerald-100 text-emerald-600'
                        : badge.status === 'progress'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-slate-200 text-slate-400'
                    }`}>
                      <span className="material-icons !text-4xl" style={{ fontVariationSettings: badge.status !== 'locked' ? "'FILL' 1" : "'FILL' 0" }}>
                        {badge.icon}
                      </span>
                    </div>

                    {/* Details */}
                    <h4 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1">{badge.name}</h4>
                    <p className="text-[11px] text-on-surface-variant font-medium mt-1 leading-snug">{badge.desc}</p>
                    <p className="text-[10px] text-outline mt-2 italic leading-tight">{badge.requirement}</p>

                    {/* Progress Bar for 'progress' and 'earned' */}
                    {badge.status !== 'locked' && (
                      <div className="w-full mt-4">
                        <div className="flex justify-between text-[9px] font-bold text-on-surface-variant mb-1">
                          <span>Progress</span>
                          <span>{badge.current}/{badge.target}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              badge.status === 'earned' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${(badge.current / badge.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MasteryProfile;
