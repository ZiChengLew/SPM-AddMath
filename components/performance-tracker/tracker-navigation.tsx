'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TRACKER_LINKS = [
  { href: '/tracker/papers', label: 'Papers' },
  { href: '/tracker/dashboard', label: 'Dashboard' }
] as const;

export function TrackerNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="border-b border-slate-200 bg-white/60 backdrop-blur">
      <div className="mx-auto flex w-full flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8 lg:max-w-[90vw]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1d4ed8]/80">Performance Tracker</p>
          <h1 className="text-2xl font-bold text-slate-800">Keep your latest papers and see smart insights</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3 rounded-full bg-slate-100/60 p-2 shadow-inner">
          {TRACKER_LINKS.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Button
                key={link.href}
                type="button"
                variant="ghost"
                className={cn(
                  'rounded-full px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-[#1d4ed8]',
                  active && 'bg-white text-[#1d4ed8] shadow-sm'
                )}
                onClick={() => router.push(link.href)}
              >
                {link.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
