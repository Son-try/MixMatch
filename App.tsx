import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Wardrobe from './components/Wardrobe';
import OutfitGenerator from './components/OutfitGenerator';
import SavedOutfits from './components/SavedOutfits';
import Profile from './components/Profile';
import { ClothingItem, Outfit, UserProfile, StyleType } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('wardrobe');
  
  // State for application data
  // In a real app, this would come from a backend/database
  const [wardrobeItems, setWardrobeItems] = useState<ClothingItem[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'User',
    favoriteStyles: [StyleType.CASUAL],
    favoriteColors: []
  });

  const handleSaveOutfit = (outfit: Outfit) => {
    setSavedOutfits(prev => [outfit, ...prev]);
    setActiveTab('saved');
  };

  const handleDeleteSaved = (id: string) => {
    setSavedOutfits(prev => prev.filter(o => o.id !== id));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'wardrobe':
        return <Wardrobe items={wardrobeItems} setItems={setWardrobeItems} />;
      case 'generator':
        return (
          <OutfitGenerator 
            wardrobe={wardrobeItems} 
            userProfile={userProfile} 
            onSaveOutfit={handleSaveOutfit} 
          />
        );
      case 'saved':
        return <SavedOutfits outfits={savedOutfits} onDelete={handleDeleteSaved} />;
      case 'profile':
        return <Profile profile={userProfile} setProfile={setUserProfile} />;
      default:
        return <Wardrobe items={wardrobeItems} setItems={setWardrobeItems} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;