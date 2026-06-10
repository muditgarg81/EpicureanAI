import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import TopAppBar from './components/TopAppBar';
import BottomNavBar from './components/BottomNavBar';
import PageTransition from './components/PageTransition';
import HealthModal from './components/HealthModal';

import DiscoveryHome from './pages/DiscoveryHome';
import OnboardingWelcome from './pages/OnboardingWelcome';
import AiRecipeGenerator from './pages/AiRecipeGenerator';
import FlavorProfilePantry from './pages/FlavorProfilePantry';
import PantryInventory from './pages/PantryInventory';
import DetailedRecipeView from './pages/DetailedRecipeView';
import OnboardingIntro from './pages/OnboardingIntro';
import OnboardingPreferences from './pages/OnboardingPreferences';
import OnboardingCoachSetup from './pages/OnboardingCoachSetup';
import OnboardingComplete from './pages/OnboardingComplete';
import AiVoiceCoach from './pages/AiVoiceCoach';
import WeeklyMealPlanner from './pages/WeeklyMealPlanner';
import FamilyKitchenHub from './pages/FamilyKitchenHub';
import MasteryProfile from './pages/MasteryProfile';
import PricingPlans from './pages/PricingPlans';
import SecureCheckout from './pages/SecureCheckout';
import PaymentSuccess from './pages/PaymentSuccess';
import HelpCenter from './pages/HelpCenter';
import AccountSettings from './pages/AccountSettings';
import ResetPassword from './pages/ResetPassword';
import Favorites from './pages/Favorites';
import JoinFamily from './pages/JoinFamily';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import RefundPolicy from './pages/RefundPolicy';
import LegalPolicies from './pages/LegalPolicies';
import useAppStore from './store/useAppStore';
import useAuthStore from './store/useAuthStore';

// Optional: Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuthStore();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><span className="animate-spin material-symbols-outlined text-4xl text-primary">autorenew</span></div>;
  if (!user) return <OnboardingWelcome />;
  
  return children;
};

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useAppStore((state) => state.theme);
  const fetchInitialData = useAppStore((state) => state.fetchInitialData);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const user = useAuthStore((state) => state.user);
  const pendingInviteToken = useAuthStore((state) => state.pendingInviteToken);
  const setPendingInviteToken = useAuthStore((state) => state.setPendingInviteToken);

  useEffect(() => {
    initializeAuth();
    // Force English on initial load as per user request
    useAppStore.getState().setLanguage('English');
  }, [initializeAuth]);

  useEffect(() => {
    if (pendingInviteToken) {
      console.log('Saving invite token and navigating to join page:', pendingInviteToken);
      localStorage.setItem('pending_invite_token', pendingInviteToken);
      navigate(`/join/${pendingInviteToken}`);
      setPendingInviteToken(null);
    }
  }, [pendingInviteToken, navigate, setPendingInviteToken]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
      const savedToken = localStorage.getItem('pending_invite_token');
      if (savedToken) {
        console.log('Found saved invite token after login, navigating to join:', savedToken);
        localStorage.removeItem('pending_invite_token');
        navigate(`/join/${savedToken}`);
      }
    }
  }, [user, fetchInitialData, navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isAuthScreen = location.pathname.startsWith('/onboarding') || location.pathname === '/';
  const isVoiceCoach = location.pathname === '/voice-coach';
  const isTransactional = ['/checkout', '/success'].includes(location.pathname);
  const showNav = !isAuthScreen && !isVoiceCoach && !isTransactional;
  const showTopNav = showNav && location.pathname !== '/recipe';

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {showTopNav && <TopAppBar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><OnboardingWelcome /></PageTransition>} />
          <Route path="/onboarding/intro" element={<PageTransition><OnboardingIntro /></PageTransition>} />
          <Route path="/onboarding/preferences" element={<PageTransition><OnboardingPreferences /></PageTransition>} />
          <Route path="/onboarding/coach" element={<PageTransition><OnboardingCoachSetup /></PageTransition>} />
          <Route path="/onboarding/complete" element={<PageTransition><OnboardingComplete /></PageTransition>} />
          <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
          
          <Route path="/discovery" element={<PageTransition><DiscoveryHome /></PageTransition>} />
          <Route path="/generator" element={<PageTransition><AiRecipeGenerator /></PageTransition>} />
          <Route path="/pantry" element={<PageTransition><PantryInventory /></PageTransition>} />
          <Route path="/pantry-profile" element={<PageTransition><FlavorProfilePantry /></PageTransition>} />
          <Route path="/recipe" element={<PageTransition><DetailedRecipeView /></PageTransition>} />
          
          <Route path="/voice-coach" element={<PageTransition><ProtectedRoute><AiVoiceCoach /></ProtectedRoute></PageTransition>} />
          <Route path="/planner" element={<PageTransition><ProtectedRoute><WeeklyMealPlanner /></ProtectedRoute></PageTransition>} />
          <Route path="/family-hub" element={<PageTransition><ProtectedRoute><FamilyKitchenHub /></ProtectedRoute></PageTransition>} />
          <Route path="/profile" element={<PageTransition><ProtectedRoute><MasteryProfile /></ProtectedRoute></PageTransition>} />
          
          <Route path="/pricing" element={<PageTransition><PricingPlans /></PageTransition>} />
          <Route path="/checkout" element={<PageTransition><SecureCheckout /></PageTransition>} />
          <Route path="/success" element={<PageTransition><PaymentSuccess /></PageTransition>} />
          <Route path="/help" element={<PageTransition><HelpCenter /></PageTransition>} />
          <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
          <Route path="/join/:token" element={<PageTransition><JoinFamily /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><ProtectedRoute><AccountSettings /></ProtectedRoute></PageTransition>} />
          <Route path="/terms" element={<PageTransition><TermsAndConditions /></PageTransition>} />
          <Route path="/privacy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
          <Route path="/refund" element={<PageTransition><RefundPolicy /></PageTransition>} />
          <Route path="/legal" element={<PageTransition><LegalPolicies /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {showNav && <BottomNavBar />}
      <HealthModal />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
