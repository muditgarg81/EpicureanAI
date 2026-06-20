import { Health } from '@capgo/capacitor-health';
import { Capacitor } from '@capacitor/core';

export const isHealthAvailable = async () => {
  if (Capacitor.getPlatform() === 'web') {
    return { available: false, reason: 'Health SDK is not supported in the web browser.' };
  }
  return await Health.isAvailable();
};

export const connectHealthPlatform = async () => {
  const availability = await isHealthAvailable();
  if (!availability.available) {
    throw new Error(`Health SDK is not available: ${availability.reason || 'Unsupported platform'}`);
  }

  // Request read authorization
  const authStatus = await Health.requestAuthorization({
    read: ['steps', 'calories', 'bloodGlucose'],
    write: []
  });

  return authStatus;
};

export const fetchHealthData = async () => {
  if (Capacitor.getPlatform() === 'web') {
    // Return mock data for web browser testing
    return { steps: 5240, calories: 450, glucose: 105 };
  }

  const yesterday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const now = new Date().toISOString();

  let steps = 0;
  let calories = 0;
  let glucose = 0;

  try {
    const stepsData = await Health.queryAggregated({
      dataType: 'steps',
      startDate: yesterday,
      endDate: now,
      bucket: 'day',
      aggregation: 'sum',
    });
    if (stepsData.samples && stepsData.samples.length > 0) {
      steps = Math.round(stepsData.samples[0].value);
    }
  } catch (e) { console.warn('Could not fetch steps', e); }

  try {
    const caloriesData = await Health.queryAggregated({
      dataType: 'calories',
      startDate: yesterday,
      endDate: now,
      bucket: 'day',
      aggregation: 'sum',
    });
    if (caloriesData.samples && caloriesData.samples.length > 0) {
      calories = Math.round(caloriesData.samples[0].value);
    }
  } catch (e) { console.warn('Could not fetch calories', e); }

  try {
    const glucoseData = await Health.readSamples({
      dataType: 'bloodGlucose',
      startDate: yesterday,
      endDate: now,
      limit: 1, // Get the most recent
    });
    if (glucoseData.samples && glucoseData.samples.length > 0) {
      glucose = Math.round(glucoseData.samples[0].value);
    }
  } catch (e) { console.warn('Could not fetch glucose', e); }

  return { steps, calories, glucose };
};
