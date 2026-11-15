import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileNavProvider, useMobileNav } from '../context/MobileNavContext';
import { SidebarCollapseProvider } from '../context/SidebarCollapseContext';
import { cn } from '../lib/cn';
import MobileNavBar from './layout/MobileNavBar';
import PageHeader from './layout/PageHeader';
import Sidebar from './layout/Sidebar';

function LayoutContent() {
  const { isOpen, close } = useMobileNav();

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) close();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [close]);

  return (
    <div className="flex h-screen max-h-dvh bg-page supports-[height:100dvh]:h-dvh">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MobileNavBar />
        <main
          className={cn(
            'hide-scrollbar relative z-0 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto',
            'pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]',
            'pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          )}
        >
          <div className="mx-auto w-full max-w-full min-w-0">
            <PageHeader />
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <MobileNavProvider>
      <SidebarCollapseProvider>
        <LayoutContent />
      </SidebarCollapseProvider>
    </MobileNavProvider>
  );
}
