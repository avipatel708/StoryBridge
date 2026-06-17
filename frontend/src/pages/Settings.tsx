import React from 'react';
import { Settings as SettingsIcon, Sun, Moon, Sparkles, User, ShieldCheck } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

export default function Settings() {
  const { theme, toggleTheme } = useUIStore();
  const { profile } = useAuthStore();

  const handleToggleTheme = () => {
    toggleTheme();
    toast.success(`Theme switched to ${theme === 'dark' ? 'light' : 'dark'} mode!`);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3 select-none">
        <SettingsIcon className="h-6 w-6 text-[#6C63FF] dark:text-[#A855F7]" />
        <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-200">Settings</h2>
      </div>

      <div className="flex flex-col gap-5">
        {/* Theme Settings */}
        <Card variant="glass" padding="md" className="flex flex-col gap-4 border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px]">
          <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-2">
            {theme === 'dark' ? <Moon className="h-4.5 w-4.5 text-[#6C63FF] dark:text-[#A855F7]" /> : <Sun className="h-4.5 w-4.5 text-[#6C63FF] dark:text-[#A855F7]" />}
            <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Visual Theme</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5 select-text">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mode Options</span>
              <span className="text-xs text-slate-450 dark:text-slate-500 font-semibold">
                StoryBridge supports dynamic theme modes. Toggle to switch.
              </span>
            </div>
            <Button
              onClick={handleToggleTheme}
              variant="outline"
              size="sm"
              className="px-4 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </Card>

        {/* Profile verification */}
        {profile && (
          <Card variant="glass" padding="md" className="flex flex-col gap-4 border border-slate-200/40 dark:border-white/8 bg-white/60 dark:bg-[#0B1020]/75 backdrop-blur-[20px]">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800/40 pb-2">
              <ShieldCheck className="h-4.5 w-4.5 text-[#6C63FF] dark:text-[#A855F7]" />
              <h3 className="text-base font-bold font-outfit text-slate-800 dark:text-slate-200">Account Safety</h3>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5 select-text">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Status: Verified Creator</span>
                <span className="text-xs text-slate-455 dark:text-slate-500 font-semibold">
                  Your profile has onboarding verification active.
                </span>
              </div>
              <span className="px-3.5 py-1 bg-green-500/10 border border-green-500/20 dark:border-green-500/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full select-none">
                Verified
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
