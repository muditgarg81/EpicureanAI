import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import brandLogo from '../assets/epicurean_logo.png';

const OnboardingWelcome = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, resetPassword, loading, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const savedToken = localStorage.getItem('pending_invite_token');
      if (savedToken) {
        console.log('Saved token found in OnboardingWelcome, redirecting to join page:', savedToken);
        localStorage.removeItem('pending_invite_token');
        navigate(`/join/${savedToken}`);
      } else if (window.location.pathname === '/') {
        navigate('/discovery');
      } else {
        // Let them stay on the protected route they were trying to access
        navigate(window.location.pathname + window.location.search);
      }
    }
  }, [user, navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || (!isForgotPassword && !password)) {
      setMessage('Please fill in all required fields.');
      return;
    }
    
    setMessage('');
    setSuccess(false);
    
    try {
      if (isForgotPassword) {
        await resetPassword(email);
        setSuccess(true);
        setMessage('Password reset link sent to your email.');
      } else if (isSignUp) {
        await signUpWithEmail(email, password);
        setMessage('Account created! You are now signed in.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'An error occurred during authentication.');
    }
  };

  const handleGoogleAuth = async () => {
    setMessage('');
    setSuccess(false);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'An error occurred during Google authentication.');
    }
  };

  return (
    <div className="flex flex-col items-center overflow-x-hidden min-h-screen">
      {/* Hero Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-secondary-container/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 right-1/4 w-80 h-80 bg-tertiary-container/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Onboarding Container */}
      <main className="relative w-full max-w-lg mx-auto flex flex-col min-h-screen px-container-margin py-xl">
        {/* High-Impact Welcome Header */}
        <div className="flex flex-col items-center text-center space-y-md mb-lg">
          <div className="relative w-64 h-64 md:w-80 md:h-80 group">
            {/* Soft breathing background glow */}
            <div className="absolute inset-0 bg-primary-container/10 rounded-3xl scale-105 blur-2xl animate-pulse"></div>
            
            {/* The Logo Image Container */}
            <div className="relative z-10 w-full h-full rounded-3xl overflow-hidden border border-outline-variant/20 shadow-xl transition-transform duration-700 hover:scale-105">
              <img
                alt="Epicurean AI Logo"
                className="w-full h-full object-contain bg-white"
                src={brandLogo}
              />
            </div>
          </div>
          <div className="space-y-base max-w-xs">
            <h1 className="font-display-lg text-display-lg text-on-background leading-tight">
              Modern Kitchen
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Master the World's Kitchens with AI.
            </p>
          </div>
        </div>

        {/* Value Proposition Bento Grid */}
        <section className="grid grid-cols-2 gap-gutter mb-xl">
          <div className="glass-panel p-md rounded-xl flex flex-col items-start space-y-xs shadow-sm">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
            <p className="font-label-md text-label-md text-on-background">AI Recipes</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Personalized flavors.</p>
          </div>
          <div className="glass-panel p-md rounded-xl flex flex-col items-start space-y-xs shadow-sm">
            <span className="material-symbols-outlined text-secondary text-3xl">language</span>
            <p className="font-label-md text-label-md text-on-background">Global Taste</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">Authentic spices.</p>
          </div>
        </section>

        {/* CTA Section / Auth */}
        <div className="mt-auto pt-lg space-y-md">
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full px-6 py-3 bg-surface-container border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
              required
            />
            {!isForgotPassword && (
              <div className="flex flex-col gap-1">
                <input 
                  type="password" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-full px-6 py-3 bg-surface-container border-none ring-1 ring-outline-variant focus:ring-2 focus:ring-primary outline-none transition-all"
                  required={!isForgotPassword}
                  minLength={6}
                />
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-right text-primary font-label-sm mt-1 mr-2 opacity-80 hover:opacity-100 transition-opacity"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-primary text-on-primary rounded-full font-label-md shadow-lg active:scale-95 transition-all disabled:opacity-70 mt-2"
            >
              {loading ? 'Processing...' : (isForgotPassword ? 'Reset Password' : (isSignUp ? 'Sign Up' : 'Sign In'))}
            </button>
            
            <button
              type="button"
              onClick={() => {
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                setMessage('');
                setSuccess(false);
              }}
              className="text-primary font-label-sm mt-2 active:scale-95 transition-transform"
            >
              {isForgotPassword ? 'Back to Sign In' : (isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up')}
            </button>
          </form>
          {message && <p className={`text-center font-label-sm ${success ? 'text-primary' : 'text-error'} animate-fade-in`}>{message}</p>}
          
          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline-variant/30"></div></div>
            <div className="relative bg-background px-4 font-label-sm text-on-surface-variant">OR</div>
          </div>

          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-14 bg-surface-container border border-outline-variant/50 text-on-surface font-label-md text-label-md rounded-full flex items-center justify-center space-x-3 shadow-sm hover:shadow-md hover:bg-surface-container-high active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <Link
            to="/discovery"
            className="w-full h-14 border border-outline text-on-surface font-label-md text-label-md rounded-full flex items-center justify-center space-x-base shadow-sm active:scale-95 transition-all duration-200 hover:bg-surface-container"
          >
            <span>Continue as Guest</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
          
          <p className="text-center font-label-sm text-label-sm text-on-surface-variant px-md mt-4">
            By continuing, you agree to our <Link className="text-primary font-bold" to="/terms">Terms of Service</Link> and <Link className="text-primary font-bold" to="/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </main>
    </div>
  );
};

export default OnboardingWelcome;
