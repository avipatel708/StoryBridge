import React from 'react';
import { Outlet } from 'react-router';
import { motion } from 'motion/react';
import { Header } from './Header';
import { LeftSidebar, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { MobileNav } from './MobileNav';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';
import { MessagesFloatingPanel } from '@/components/layout/MessagesFloatingPanel';
import { useNotificationsRealtime } from '@/hooks/useNotificationsRealtime';
import { useUIStore } from '@/stores/uiStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function MainLayout() {
  useNotificationsRealtime();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const sidebarPadding = sidebarOpen ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1020] text-[#0F172A] dark:text-[#F8FAFC] font-sans relative overflow-x-hidden">
      {/* Ambient background decoration */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#6C63FF]/10 blur-[100px] dark:bg-[#6C63FF]/5 feed-mesh-orb z-0" />
      <div className="pointer-events-none absolute top-1/2 right-[-20%] w-[500px] h-[500px] rounded-full bg-[#A855F7]/8 blur-[130px] dark:bg-[#A855F7]/4 feed-mesh-orb-delayed z-0" />

      <LeftSidebar />

      <motion.div
        initial={false}
        animate={{ paddingLeft: isDesktop ? sidebarPadding : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 36 }}
        className="min-h-screen"
      >
        <div className="md:hidden">
          <Header />
        </div>

        <div className="max-w-[975px] mx-auto px-4 sm:px-6 py-6 md:py-10 flex gap-8 justify-center">
          <main className="w-full max-w-[630px] flex-shrink-0 pb-20 md:pb-0 min-w-0">
            <Outlet />
          </main>
          <RightSidebar />
        </div>
      </motion.div>

      <MobileNav />
      <CreatePostModal />
      <GlobalSearchModal />
      <MessagesFloatingPanel />
    </div>
  );
}
export default MainLayout;
