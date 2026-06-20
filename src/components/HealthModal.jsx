import React, { useState, useEffect } from 'react';
import useAppStore from '../store/useAppStore';

const HealthModal = () => {
  const isHealthModalOpen = useAppStore((state) => state.isHealthModalOpen);
  const setHealthModalOpen = useAppStore((state) => state.setHealthModalOpen);
  const healthGoals = useAppStore((state) => state.healthGoals);
  const setHealthGoals = useAppStore((state) => state.setHealthGoals);

  const healthIntegrations = useAppStore((state) => state.healthIntegrations);
  const syncedHealthData = useAppStore((state) => state.syncedHealthData);
  const toggleHealthIntegration = useAppStore((state) => state.toggleHealthIntegration);

  const [localGoals, setLocalGoals] = useState(healthGoals);
  const [loadingApp, setLoadingApp] = useState(null);

  useEffect(() => {
    if (isHealthModalOpen) {
      setLocalGoals(healthGoals);
    }
  }, [isHealthModalOpen, healthGoals]);

  if (!isHealthModalOpen) return null;

  const onClose = () => setHealthModalOpen(false);

  const handleSave = () => {
    setHealthGoals(localGoals);
    onClose();
  };

  const integrations = [
    { id: 'appleHealth', name: 'Apple Health', icon: 'favorite', color: 'text-red-500' },
    { id: 'googleFit', name: 'Google Health Connect', icon: 'directions_run', color: 'text-blue-500' },
    { id: 'glucoseMonitor', name: 'Glucose Monitor', icon: 'monitor_heart', color: 'text-purple-500' },
  ];

  const handleToggle = async (id, currentVal) => {
    setLoadingApp(id);
    try {
      await toggleHealthIntegration(id, !currentVal);
    } catch (e) {
      alert("Error syncing health data. Make sure you are on a real mobile device or grant permissions.");
    } finally {
      setLoadingApp(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <h3 className="font-headline-md text-on-surface">Health & Nutrition</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Connect Health Apps */}
        <div className="mb-6">
          <h4 className="font-label-lg text-on-surface-variant uppercase tracking-widest text-xs mb-3">Connect Health App</h4>
          <div className="space-y-2">
            {integrations.map(({ id, name, icon, color }) => {
              const isEnabled = healthIntegrations[id];
              const isLoading = loadingApp === id;

              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-3.5 bg-surface-container rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span className="font-label-md text-on-surface">{name}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleToggle(id, isEnabled)}
                    disabled={isLoading}
                    className={`relative w-12 h-6 rounded-full transition-colors flex items-center px-1 ${
                      isEnabled ? 'bg-primary' : 'bg-surface-variant'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Synced Data Display */}
        {(healthIntegrations.appleHealth || healthIntegrations.googleFit || healthIntegrations.glucoseMonitor) && (
          <div className="mb-6 p-4 rounded-2xl bg-secondary-container border border-secondary/20">
            <h4 className="font-label-lg text-secondary-dark uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Synced Real-Time Data
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-surface p-2 rounded-xl text-center">
                <span className="block text-xs text-on-surface-variant">Steps</span>
                <span className="font-headline-sm text-primary">{syncedHealthData.steps || 0}</span>
              </div>
              <div className="bg-surface p-2 rounded-xl text-center">
                <span className="block text-xs text-on-surface-variant">Cal Burned</span>
                <span className="font-headline-sm text-amber-600">{syncedHealthData.activeCalories || 0}</span>
              </div>
              <div className="bg-surface p-2 rounded-xl text-center">
                <span className="block text-xs text-on-surface-variant">Glucose</span>
                <span className="font-headline-sm text-purple-600">{syncedHealthData.currentGlucose || '--'}</span>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant text-center mt-2 opacity-80">
              * Goals below automatically sync based on this real-time data.
            </p>
          </div>
        )}

        {/* Manual Goals Form */}
        <div>
          <h4 className="font-label-lg text-on-surface-variant uppercase tracking-widest text-xs mb-3">Set Your Goals Manually</h4>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="font-label-sm text-on-surface-variant text-sm">Daily Calories Target (kcal)</label>
              <input
                type="number"
                min={500}
                max={10000}
                value={localGoals.calories || ''}
                onChange={(e) => setLocalGoals((g) => ({ ...g, calories: e.target.value }))}
                className="w-full bg-surface-container px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-body-md"
                placeholder="e.g., 2000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-label-sm text-on-surface-variant text-sm">Fitness Goal</label>
              <select
                value={localGoals.fitnessGoal || 'General Health'}
                onChange={(e) => setLocalGoals((g) => ({ ...g, fitnessGoal: e.target.value }))}
                className="w-full bg-surface-container px-4 py-3 rounded-xl outline-none font-body-md"
              >
                <option>Weight Loss</option>
                <option>Muscle Gain</option>
                <option>Maintenance</option>
                <option>General Health</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="font-label-sm text-on-surface-variant text-sm">Blood Glucose Target (mg/dL)</label>
              <input
                type="text"
                value={localGoals.glucoseTarget || ''}
                onChange={(e) => setLocalGoals((g) => ({ ...g, glucoseTarget: e.target.value }))}
                className="w-full bg-surface-container px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all font-body-md"
                placeholder="e.g., 80-120"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3.5 text-on-surface-variant hover:bg-surface-container rounded-full transition-all font-label-md">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3.5 bg-primary text-on-primary rounded-full font-label-md shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            Save Goals
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthModal;
