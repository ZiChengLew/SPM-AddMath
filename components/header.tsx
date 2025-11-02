'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, Users, HelpCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const goHome = () => router.push('/');
  const goLists = () => router.push('/lists');
  const goTracker = () => router.push('/tracker/papers');

  const onHome = pathname === '/' || pathname === '/page';
  const onLists = pathname?.startsWith('/lists');
  const onTracker = pathname?.startsWith('/tracker');

  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex w-full items-center justify-between px-6 py-3 md:px-8 lg:max-w-[90vw]">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-slate-700">
            <Menu className="h-5 w-5" />
          </Button>
          <button
            type="button"
            onClick={goHome}
            className={cn(
              'flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]',
              onHome && 'border-[#1d4ed8] text-[#1d4ed8]'
            )}
          >
            Topical Past Paper Questions
          </button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#1d4ed8] hover:bg-slate-50 hover:text-[#1d4ed8]',
              onLists && 'border-[#1d4ed8] text-[#1d4ed8]'
            )}
            onClick={goLists}
          >
            Question Lists
          </Button>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[#1d4ed8] hover:bg-slate-50 hover:text-[#1d4ed8]',
              onTracker && 'border-[#1d4ed8] text-[#1d4ed8]'
            )}
            onClick={goTracker}
          >
            Performance Tracker
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-slate-700">
            <Users className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-700">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-slate-700">
            <Mail className="h-5 w-5" />
          </Button>
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            Login
          </Button>
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
            Register
          </Button>
        </div>
      </div>
    </header>
  );
}
