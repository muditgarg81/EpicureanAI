import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { joinFamilyWithToken, fetchFamilyByInviteToken } from '../services/dbService';
import useAppStore from '../store/useAppStore';
import useAuthStore from '../store/useAuthStore';

export default function JoinFamily() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [inviteData, setInviteData] = useState(null);
  const fetchInitialData = useAppStore((state) => state.fetchInitialData);
  const user = useAuthStore((state) => state.user);

  // Step 1: Validate the token (always – even for guests)
  useEffect(() => {
    const checkInvite = async () => {
      try {
        const data = await fetchFamilyByInviteToken(token);
        if (!data) {
          setError("This invite link is invalid or has expired. Please ask the host for a new link.");
        } else {
          setInviteData(data);
          // Always persist token so post-login redirect can pick it up
          localStorage.setItem('pending_invite_token', token);
        }
      } catch (err) {
        console.error("Error validating invite:", err);
        setError("Could not validate this invite link. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    checkInvite();
  }, [token]);

  // Step 2: If user becomes authenticated AND there's a valid invite, auto-join
  useEffect(() => {
    if (!user || !inviteData || joining || success || error) return;

    const doJoin = async () => {
      setJoining(true);
      try {
        const newFamilyId = await joinFamilyWithToken(token);
        if (newFamilyId) {
          localStorage.removeItem('pending_invite_token');
          useAppStore.setState({ familyId: newFamilyId });
          await fetchInitialData();
          setSuccess(true);
          setTimeout(() => navigate('/family-hub'), 2200);
        } else {
          setError("Could not join the family. You may already be a member, or the invite has been used.");
        }
      } catch (err) {
        console.error("Error joining family:", err);
        setError(err.message || "Failed to join the family. Please try again.");
      } finally {
        setJoining(false);
      }
    };

    doJoin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, inviteData]);

  const familyName = inviteData?.families?.name || 'a Family Kitchen';

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6">
        <div className="animate-spin text-primary mb-4">
          <span className="material-symbols-outlined text-5xl">autorenew</span>
        </div>
        <p className="text-lg font-medium text-on-surface-variant">Validating invitation...</p>
      </div>
    );
  }

  if (joining) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin text-primary mb-4">
          <span className="material-symbols-outlined text-5xl">autorenew</span>
        </div>
        <p className="text-lg font-medium">Joining {familyName}...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-6 animate-bounce">
          <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>celebration</span>
        </div>
        <h1 className="text-3xl font-bold mb-3 text-on-surface">Welcome to the Kitchen!</h1>
        <p className="text-on-surface-variant max-w-sm mb-2">
          You have joined <strong>{familyName}</strong> successfully.
        </p>
        <p className="text-sm text-on-surface-variant">Redirecting to Family Hub...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-5xl">link_off</span>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-on-surface">Invitation Error</h1>
        <p className="text-on-surface-variant max-w-sm mb-8">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-full bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity"
        >
          Go to Home
        </button>
      </div>
    );
  }

  // Invite is valid. If not logged in, show the beautiful invite landing page.
  if (!user) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-6">
          <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mx-auto shadow-inner">
            <span
              className="material-symbols-outlined text-primary text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              family_restroom
            </span>
          </div>

          <div>
            <p className="text-on-surface-variant text-sm uppercase tracking-wider mb-1">You've been invited to join</p>
            <h1 className="text-3xl font-bold text-on-surface mb-2">{familyName}</h1>
            <p className="text-on-surface-variant text-base">
              Sign in or create a free Epicurean AI account to accept this invitation and start cooking together.
            </p>
          </div>

          <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20 text-left space-y-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              <span className="font-medium text-on-surface">Shared Meal Planner</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
              <span className="font-medium text-on-surface">Family Grocery List</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
              <span className="font-medium text-on-surface">AI Kitchen Coach</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-4 rounded-2xl bg-primary text-on-primary font-semibold text-lg shadow-lg hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Sign In / Create Account
            </button>
            <a
              href={`epicurean.kitchen.app://join/${token}`}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-surface-container border border-primary text-primary font-semibold text-lg hover:bg-primary/10 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-primary">smartphone</span>
              Open in Native App
            </a>
            <p className="text-xs text-on-surface-variant px-4 text-center mt-4">
              Your invitation will be remembered. After signing in, you'll be automatically redirected here to complete joining.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
