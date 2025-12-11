
import React, { useState } from 'react';
import { Sparkles, Loader2, Save, RefreshCcw, Eye, ImageIcon } from 'lucide-react';
import { ClothingItem, Outfit, UserProfile, StyleType, Gender } from '../types';
import { generateOutfitSuggestions, generateOutfitVisualization } from '../services/geminiService';

interface OutfitGeneratorProps {
  wardrobe: ClothingItem[];
  userProfile: UserProfile;
  onSaveOutfit: (outfit: Outfit) => void;
}

const OCCASIONS = [
  "Casual Hangout",
  "Date Night",
  "Office / Work",
  "Formal Event",
  "Gym / Sport",
  "Travel"
];

const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({ wardrobe, userProfile, onSaveOutfit }) => {
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0]);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>(userProfile.favoriteStyles[0] || StyleType.CASUAL);
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.FEMALE);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<Outfit[]>([]);
  const [generatingVisualId, setGeneratingVisualId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (wardrobe.length < 2) {
      alert("Please add at least a top and a bottom to your wardrobe first.");
      return;
    }

    setIsGenerating(true);
    setGeneratedOutfits([]);

    try {
      // Use the locally selected style instead of just the profile default
      const suggestions = await generateOutfitSuggestions(
        wardrobe, 
        selectedOccasion, 
        selectedStyle
      );

      // Map back from ID strings to full objects
      const fullOutfits: Outfit[] = suggestions.map((s: any) => ({
        id: crypto.randomUUID(),
        name: s.name,
        occasion: selectedOccasion,
        reasoning: s.reasoning,
        items: s.itemIds.map((id: string) => wardrobe.find(item => item.id === id)).filter((item: ClothingItem | undefined): item is ClothingItem => !!item)
      })).filter((o: Outfit) => o.items.length > 0);

      setGeneratedOutfits(fullOutfits);
    } catch (error) {
      console.error(error);
      alert("Oops! AI couldn't generate outfits right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisualize = async (outfit: Outfit) => {
    setGeneratingVisualId(outfit.id);
    
    // Construct a rich description for the image generator
    const itemsDesc = outfit.items.map(i => `${i.color} ${i.style} ${i.category} (${i.description})`).join(', ');
    const fullDesc = `${itemsDesc}. The user is going to a ${outfit.occasion}. Style: ${outfit.reasoning}`;

    try {
      const imageUrl = await generateOutfitVisualization(fullDesc, outfit.occasion, selectedGender);
      if (imageUrl) {
        setGeneratedOutfits(prev => prev.map(o => 
          o.id === outfit.id ? { ...o, generatedImageUrl: imageUrl } : o
        ));
      } else {
        alert("Could not generate image visualization at this time.");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating visualization.");
    } finally {
      setGeneratingVisualId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          AI Stylist
        </h2>
        <p className="text-indigo-100 mb-6">Let MixMatch discover the best combinations from your closet.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Occasion Selector */}
          <div>
            <label className="block text-xs font-medium text-indigo-200 uppercase tracking-wider mb-1">Occasion</label>
            <select 
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
            >
              {OCCASIONS.map(occ => <option key={occ} value={occ} className="text-gray-900">{occ}</option>)}
            </select>
          </div>

          {/* Style Selector */}
          <div>
             <label className="block text-xs font-medium text-indigo-200 uppercase tracking-wider mb-1">Style Preference</label>
             <select
               value={selectedStyle}
               onChange={(e) => setSelectedStyle(e.target.value as StyleType)}
               className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
             >
               {Object.values(StyleType).map((style) => (
                 <option key={style} value={style} className="text-gray-900">{style}</option>
               ))}
             </select>
          </div>

          {/* Gender Selector */}
          <div>
             <label className="block text-xs font-medium text-indigo-200 uppercase tracking-wider mb-1">Gender (for Preview)</label>
             <select
               value={selectedGender}
               onChange={(e) => setSelectedGender(e.target.value as Gender)}
               className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
             >
               {Object.values(Gender).map((g) => (
                 <option key={g} value={g} className="text-gray-900">{g}</option>
               ))}
             </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-6 w-full bg-white text-indigo-600 font-bold py-3 rounded-lg shadow-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Mixing & Matching...
            </>
          ) : (
            <>
              <RefreshCcw className="w-5 h-5" />
              Generate Outfits
            </>
          )}
        </button>
      </div>

      {generatedOutfits.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recommended for You</h3>
          </div>
          
          <div className="grid gap-8">
            {generatedOutfits.map((outfit) => (
              <div key={outfit.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">{outfit.name}</h4>
                        <p className="text-sm text-gray-500">{outfit.items.length} items • {outfit.occasion}</p>
                    </div>
                    <button 
                        onClick={() => onSaveOutfit(outfit)}
                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors"
                    >
                        <Save className="w-5 h-5" />
                    </button>
                    </div>

                    <div className="bg-indigo-50/50 rounded-lg p-3 text-sm text-gray-600 italic mb-4">
                        " {outfit.reasoning} "
                    </div>
                    
                    {/* Outfit Visual Grid - Items */}
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                    {outfit.items.map((item) => (
                        <div key={item.id} className="flex-none w-24 snap-start">
                        <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-2 border border-gray-100">
                            <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs font-medium text-center text-gray-700 truncate">{item.category}</p>
                        </div>
                    ))}
                    </div>

                    <hr className="my-4 border-gray-100" />

                    {/* AI Visualization Section */}
                    {outfit.generatedImageUrl ? (
                        <div className="mt-4">
                            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-indigo-600" /> AI Virtual Try-On ({selectedGender})
                            </p>
                            <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-md">
                                <img 
                                    src={outfit.generatedImageUrl} 
                                    alt="AI generated look" 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md">
                                    AI Generated Preview
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => handleVisualize(outfit)}
                            disabled={generatingVisualId === outfit.id}
                            className="w-full mt-2 py-3 border border-indigo-200 bg-indigo-50/30 text-indigo-700 rounded-xl font-medium text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {generatingVisualId === outfit.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <ImageIcon className="w-4 h-4" />
                            )}
                            Visualize This Look (AI)
                        </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitGenerator;
