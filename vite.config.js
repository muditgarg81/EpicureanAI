import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { exec } from 'child_process';

const capacitorSyncPlugin = () => {
  return {
    name: 'capacitor-sync-plugin',
    closeBundle() {
      console.log('\n🔄 React build finished! Syncing assets to Android Studio...');
      exec('npx cap sync android', (err, stdout, stderr) => {
        if (err) {
          console.error('❌ Capacitor sync failed:', err);
          return;
        }
        console.log(stdout);
        console.log('✅ Android Studio assets updated successfully!');
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      injectRegister: false,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Epicurean AI Kitchen Coach',
        short_name: 'Epicurean',
        description: 'Your intelligent culinary companion.',
        theme_color: '#fff8f1',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    capacitorSyncPlugin()
  ],
});
