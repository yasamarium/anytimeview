import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AnytimeView — Minimalist Stream & Document Vault',
  description:
    'High-performance distributed media streaming and document vault synchronized across Kolkata, Israel, and US clusters.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark bg-[#07080a]">
      <body className="min-h-screen bg-[#07080a] text-neutral-100 antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
