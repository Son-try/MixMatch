import React from 'react';
import { Shirt, Sparkles, Heart, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'wardrobe', label: 'Wardrobe', icon: Shirt },
    { id: 'generator', label: 'MixMatch', icon: Sparkles },
    { id: 'saved', label: 'Favorites', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">MixMatch</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
        <div className="flex justify-around items-center h-16 max-w-5xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'fill-indigo-100' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;