import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Oswald, Silkscreen, Anek_Devanagari, Inter, Outfit, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { FestProvider } from '../context/FestContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProfileCompletionModal } from '../components/layout/ProfileCompletionModal';
import { CustomCursor } from '../components/ui/CustomCursor';

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500'],
  variable: '--font-oswald',
  display: 'swap',
});

const silkscreen = Silkscreen({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-silkscreen',
  display: 'swap',
});

const anekDevanagari = Anek_Devanagari({
  subsets: ['latin', 'devanagari'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-devanagari',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'PARINAAM 2026 | Amrita Vishwa Vidyapeetham, Amaravati',
  description: 'Official portal for Parinaam 2026 at Amrita Vishwa Vidyapeetham, Amaravati. Explore 35+ national events, hackathons, robotics combat, battle of bands, and generate your digital QR pass.',
  keywords: ['college fest', 'techfest', 'hackathon', 'robotics combat', 'parinaam 2026', 'amrita fest', 'amaravati fest', 'pixel font style'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark w-full max-w-full overflow-x-hidden ${oswald.variable} ${silkscreen.variable} ${anekDevanagari.variable} ${inter.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
      </head>
      <body
        className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#05030a] text-slate-100 antialiased flex flex-col justify-between selection:bg-purple-600 selection:text-white"
        suppressHydrationWarning
      >
        <CustomCursor />
        <AuthProvider>
          <CartProvider>
            <FestProvider>
              <Navbar />
              <ProfileCompletionModal />
              <main className="flex-1 w-full max-w-full overflow-x-hidden">{children}</main>
              <Footer />
            </FestProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

