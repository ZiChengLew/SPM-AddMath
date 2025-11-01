import { Header } from '@/components/header';
import type { ReactNode } from 'react';

export default function PagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#eff3f9] text-slate-800">
      <Header />
      {children}
    </div>
  );
}
