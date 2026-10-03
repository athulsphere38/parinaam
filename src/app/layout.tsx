import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import { FestProvider } from '../context/FestContext';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProfileCompletionModal } from '../components/layout/ProfileCompletionModal';
import { CustomCursor } from '../components/ui/CustomCursor';

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
    <html lang="en" className="dark w-full max-w-full overflow-x-hidden" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@200;300;400;500&family=Pixelify+Sans:wght@400;500;600;700&family=Silkscreen:wght@400;700&family=Anek+Devanagari:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
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

