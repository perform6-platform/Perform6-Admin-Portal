import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileNavProvider, useMobileNav } from '../context/MobileNavContext';
import { SidebarCollapseProvider } from '../context/SidebarCollapseContext';
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
    <div className="flex h-screen bg-page">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileNavBar />
        <main className="hide-scrollbar relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <PageHeader />
          <Outlet />
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
