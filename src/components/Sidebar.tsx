import React from 'react';
import { Home, Search, Library, BookOpen, LogOut, Unplug } from 'lucide-react';
import { logoutAppAction } from '@/app/actions/auth';

interface NavItemProps {
  icon: React.ReactElement;
  label: string;
  active: boolean;
  onClick: () => void;
}

export function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: `w-5 h-5 ${active ? 'text-brand' : ''}` })}
      {label}
    </button>
  );
}

export function MobileNavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-brand' : 'text-white/50'}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-6 h-6' })}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isStorytelConnected?: boolean;
  onUnlinkStorytel?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isStorytelConnected, onUnlinkStorytel }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#050505] border-r border-white/5 flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-serif font-bold text-brand flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          AudioKitap
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <NavItem icon={<Home />} label="Ana Sayfa" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem icon={<Search />} label="Keşfet" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
        <NavItem icon={<Library />} label="Kitaplığım" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
      </nav>
      <div className="p-4 border-t border-white/5 flex flex-col gap-2">
        {isStorytelConnected && (
          <button
            onClick={onUnlinkStorytel}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-orange-500/70 hover:text-orange-500 hover:bg-orange-500/10 transition-all duration-200"
          >
            <Unplug className="w-5 h-5" />
            Bağlantıyı Kes
          </button>
        )}
        <button
          onClick={() => logoutAppAction()}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg font-medium text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-white/5 flex justify-around pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] z-40">
      <MobileNavItem icon={<Home />} label="Ana Sayfa" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
      <MobileNavItem icon={<Search />} label="Keşfet" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
      <MobileNavItem icon={<Library />} label="Kitaplığım" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
    </div>
  );
}
