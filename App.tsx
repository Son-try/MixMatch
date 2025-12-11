import React, { useState, Suspense, useEffect } from 'react';
import Layout from './components/Layout';
import { ClothingItem, Outfit, UserProfile, StyleType } from './types';
import { Loader2 } from 'lucide-react';
import Onboarding from './components/Onboarding';

// Lazy load components to reduce initial bundle size and memory usage
const Wardrobe = React.lazy(() => import('./components/Wardrobe'));
const OutfitGenerator = React.lazy(() => import('./components/OutfitGenerator'));
const SavedOutfits = React.lazy(() => import('./components/SavedOutfits'));
const Profile = React.lazy(() => import('./components/Profile'));
const CalendarView = React.lazy(() => import('./components/CalendarView'));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // State for application data
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [historyOutfits, setHistoryOutfits] = useState<Outfit[]>([]);
  const [scheduledOutfits, setScheduledOutfits] = useState<Outfit[]>([]);
  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    favoriteStyles: [StyleType.CASUAL],
    favoriteColors: []
  });

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('dripframe_onboarded');
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCompleteOnboarding = () => {
    localStorage.setItem('dripframe_onboarded', 'true');
    setShowOnboarding(false);
  };

  const handleSaveOutfit = (outfit: Outfit) => {
    // Check if already saved
    if (!savedOutfits.some(o => o.id === outfit.id)) {
      setSavedOutfits(prev => [outfit, ...prev]);
    }
  };

  const handleToggleFavorite = (outfit: Outfit) => {
    if (savedOutfits.some(o => o.id === outfit.id)) {
      setSavedOutfits(prev => prev.filter(o => o.id !== outfit.id));
    } else {
      setSavedOutfits(prev => [outfit, ...prev]);
    }
  };

  const handleAddToHistory = (newOutfits: Outfit[]) => {
    setHistoryOutfits(prev => {
      // Avoid duplicates just in case, though IDs are random
      const existingIds = new Set(prev.map(o => o.id));
      const uniqueNew = newOutfits.filter(o => !existingIds.has(o.id));
      return [...uniqueNew, ...prev].slice(0, 50); // Keep last 50
    });
  };

  const handleDeleteSaved = (id: string) => {
    setSavedOutfits(prev => prev.filter(o => o.id !== id));
  };

  const handleScheduleOutfit = (outfit: Outfit, date: string) => {
    const scheduledOutfit = { ...outfit, scheduledDate: date, id: crypto.randomUUID() }; // New ID for the calendar event instance
    setScheduledOutfits(prev => [...prev, scheduledOutfit]);
  };

  const handleRemoveSchedule = (id: string) => {
    setScheduledOutfits(prev => prev.filter(o => o.id !== id));
  };

  const renderContent = () => {
    return (
      <Suspense fallback={
        <div className="flex h-full items-center justify-center p-10">
          <Loader2 className="w-10 h-10 text-[#CCFF00] animate-spin" />
        </div>
      }>
        {activeTab === 'wardrobe' && (
          <Wardrobe items={wardrobeItems} setItems={setWardrobeItems} />
        )}
        {activeTab === 'generator' && (
          <OutfitGenerator 
            wardrobe={wardrobeItems} 
            userProfile={userProfile} 
            onSaveOutfit={handleSaveOutfit}
            onScheduleOutfit={handleScheduleOutfit}
            onAddToHistory={handleAddToHistory}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView 
            scheduledOutfits={scheduledOutfits}
            onRemoveSchedule={handleRemoveSchedule}
          />
        )}
        {activeTab === 'saved' && (
          <SavedOutfits 
            savedOutfits={savedOutfits} 
            historyOutfits={historyOutfits}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteSaved} 
            onSchedule={handleScheduleOutfit}
          />
        )}
        {activeTab === 'profile' && (
          <Profile profile={userProfile} setProfile={setUserProfile} />
        )}
      </Suspense>
    );
  };

  return (
    <>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}
    </>
  );
};

export default App;
