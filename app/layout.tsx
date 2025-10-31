import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SPM Additional Mathematics',
  description: 'Image-based bank of SPM Additional Mathematics questions and solutions'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
