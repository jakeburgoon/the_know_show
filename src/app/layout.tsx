import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'The Know Show',
  description: "It's time to show what you know! An interactive multiplayer trivia game for family and friends.",
  openGraph: {
    title: 'The Know Show',
    description: "It's time to show what you know!",
    type: 'website',
    url: 'https://the-know-show.vercel.app',
    images: [
      'https://the-know-show.vercel.app/app-icon-192.png'
    ],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/app-icon-192.png',
    apple: '/app-icon-180.png'
  }
};

export const viewport: Viewport = {
  themeColor: '#0d233b',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return <html lang="en"><body>{children}</body></html>;
}
