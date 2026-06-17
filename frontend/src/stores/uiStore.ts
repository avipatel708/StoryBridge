import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  sidebarPinned: boolean;
  createPostOpen: boolean;
  messagesPanelOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarPinned: (pinned: boolean) => void;
  setCreatePostOpen: (open: boolean) => void;
  setMessagesPanelOpen: (open: boolean) => void;
  toggleMessagesPanel: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarOpen: false,
      sidebarPinned: false,
      createPostOpen: false,
      messagesPanelOpen: false,
      searchOpen: false,
      searchQuery: '',
      toggleTheme: () => set((state) => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: nextTheme };
      }),
      setTheme: (theme) => set(() => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme };
      }),
      toggleSidebar: () =>
        set((state) => {
          const nextPinned = !state.sidebarPinned;
          return { sidebarPinned: nextPinned, sidebarOpen: nextPinned };
        }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarPinned: (pinned) => set({ sidebarPinned: pinned, sidebarOpen: pinned }),
      setCreatePostOpen: (open) => set({ createPostOpen: open }),
      setMessagesPanelOpen: (open) => set({ messagesPanelOpen: open }),
      toggleMessagesPanel: () => set((state) => ({ messagesPanelOpen: !state.messagesPanelOpen })),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'storybridge-ui-storage',
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);
