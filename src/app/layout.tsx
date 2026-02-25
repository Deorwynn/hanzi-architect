import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';
import GlobalNav from '@/components/navigation/GlobalNav';
import SettingsSidebar from '@/components/navigation/SettingsSidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Hanzi Architect',
  description: 'Decomposition Analysis & Linguistic Lab',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1419] text-white overflow-hidden h-full flex flex-col`}
      >
        <SettingsProvider>
          {/* BACKGROUND GRID */}
          <div
            className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
            style={{
              backgroundImage: `linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .5) 25%, rgba(6, 182, 212, .5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .5) 75%, rgba(6, 182, 212, .5) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(6, 182, 212, .5) 25%, rgba(6, 182, 212, .5) 26%, transparent 27%, transparent 74%, rgba(6, 182, 212, .5) 75%, rgba(6, 182, 212, .5) 76%, transparent 77%, transparent)`,
              backgroundSize: '50px 50px',
            }}
          />

          <GlobalNav />

          <div className="flex-1 flex overflow-hidden relative z-10">
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {children}
            </main>

            <SettingsSidebar />
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
