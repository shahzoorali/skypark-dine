import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SKYPARK CAFE — Menu',
  description: 'The dine-in menu at Skypark Cafe, Banjara Hills, Hyderabad.',
};

export const viewport: Viewport = {
  themeColor: '#2D2D2D',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
