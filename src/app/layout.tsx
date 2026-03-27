import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reality Bets',
  description: 'Bet on your favourite reality shows',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
