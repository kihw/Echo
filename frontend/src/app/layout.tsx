import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { PWAInstaller } from '@/components/pwa/PWAInstaller';
import { Toaster } from 'react-hot-toast';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Echo Music Player',
  description: 'Lecteur de musique intelligent avec synchronisation multi-plateforme et recommandations personnalisées',
  keywords: ['musique', 'lecteur', 'playlist', 'streaming', 'Spotify', 'Deezer', 'YouTube Music'],
  authors: [{ name: 'Echo Team' }],
  creator: 'Echo Team',
  publisher: 'Echo Music Player',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png'
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: process.env.NEXT_PUBLIC_FRONTEND_URL,
    title: 'Echo Music Player',
    description: 'Lecteur de musique intelligent avec synchronisation multi-plateforme',
    siteName: 'Echo Music Player',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Echo Music Player'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echo Music Player',
    description: 'Lecteur de musique intelligent avec synchronisation multi-plateforme',
    images: ['/og-image.png']
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' }
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Echo" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
          <PWAInstaller />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              className: 'text-sm',
              style: {
                background: '#363636',
                color: '#fff'
              },
              success: {
                style: {
                  background: '#10b981'
                }
              },
              error: {
                style: {
                  background: '#ef4444'
                }
              }
            }}
          />
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  );
}
