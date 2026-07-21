import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			registerType: 'prompt',
			injectRegister: false,
			includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-icon.svg'],
			manifest: {
				id: '/',
				name: 'The League',
				short_name: 'The League',
				description: 'Track leagues, challenges, points and bragging rights.',
				theme_color: '#111827',
				background_color: '#f8fafc',
				display: 'standalone',
				orientation: 'portrait-primary',
				start_url: '/',
				scope: '/',
				categories: ['sports', 'entertainment', 'productivity'],
				icons: [
					{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			},
			workbox: {
				cleanupOutdatedCaches: true,
				navigateFallback: '/index.html',
				globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
				runtimeCaching: [
					{
						urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
						handler: 'NetworkOnly',
						options: { cacheName: 'theleague-api-network-only' }
					},
					{
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'theleague-pages',
							networkTimeoutSeconds: 3,
							expiration: { maxEntries: 20, maxAgeSeconds: 7 * 24 * 60 * 60 }
						}
					},
					{
						urlPattern: ({ request, url }) => request.destination === 'image' && !url.pathname.startsWith('/api/'),
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'theleague-static-images',
							expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }
						}
					}
				]
			},
			devOptions: {
				enabled: false
			}
		})
	],
	server: {
		port: 5173
	}
});
