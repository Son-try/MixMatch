import React from 'react';
import { Shirt, Heart, User, Calendar } from 'lucide-react';

// Custom DripFrame Icon (Star)
const DripFrameIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
    { id: 'generator', label: 'DripFrame', icon: DripFrameIcon },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'saved', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-black sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {/* Logo container - Yellow box with black border */}
          <div className="bg-[#CCFF00] border-2 border-black p-1.5 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <DripFrameIcon className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-black uppercase italic hidden sm:block">DRIPFRAME</h1>
          <h1 className="text-xl font-black tracking-tighter text-black uppercase italic sm:hidden">DRIPFRAME</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black z-30 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-5xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all ${
                  isActive ? 'bg-[#CCFF00] text-black border-t-2 border-black' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'fill-none' : ''}`} />
                <span className={`text-[9px] font-bold uppercase ${isActive ? 'tracking-wider' : ''}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
