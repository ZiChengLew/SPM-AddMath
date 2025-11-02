import type { ReactNode } from 'react';
import { TrackerNavigation } from '@/components/performance-tracker/tracker-navigation';

export default function TrackerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="pb-12">
      <TrackerNavigation />
      <main className="mx-auto mt-8 w-full px-6 md:px-8 lg:max-w-[90vw]">{children}</main>
    </div>
  );
}
