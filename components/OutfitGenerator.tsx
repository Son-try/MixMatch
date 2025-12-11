import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCcw, ImageIcon, Star, Lightbulb, CheckCircle2, Heart, Check, Share2, MapPin, CloudSun, CalendarPlus, X } from 'lucide-react';
import { ClothingItem, Outfit, UserProfile, StyleType, Gender, WeatherData } from '../types';
import { generateOutfitSuggestions, generateOutfitVisualization, rateOutfit } from '../services/geminiService';
import { fetchWeather } from '../services/weatherService';

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

interface OutfitGeneratorProps {
  wardrobe: ClothingItem[];
  userProfile: UserProfile;
  onSaveOutfit: (outfit: Outfit) => void;
  onScheduleOutfit: (outfit: Outfit, date: string) => void;
  onAddToHistory?: (outfits: Outfit[]) => void;
}

const OCCASIONS = [
  "Casual Hangout",
  "Date Night",
  "Office / Work",
  "Formal Event",
  "Gym / Sport",
  "Travel"
];

const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({ wardrobe, userProfile, onSaveOutfit, onScheduleOutfit, onAddToHistory }) => {
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0]);
  const [selectedStyle, setSelectedStyle] = useState<StyleType>(userProfile.favoriteStyles[0] || StyleType.CASUAL);
  const [selectedGender, setSelectedGender] = useState<Gender>(Gender.FEMALE);
  
  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<Outfit[]>([]);
  const [generatingVisualId, setGeneratingVisualId] = useState<string | null>(null);
  const [ratingLoadingId, setRatingLoadingId] = useState<string | null>(null);
  
  // Scheduling State
  const [schedulingOutfitId, setSchedulingOutfitId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>("");

  const [savedOutfitIds, setSavedOutfitIds] = useState<Set<string>>(new Set());

  // Refs for unmount logic
  const generatedOutfitsRef = useRef<Outfit[]>([]);
  const savedOutfitIdsRef = useRef<Set<string>>(new Set());
  const onSaveOutfitRef = useRef(onSaveOutfit);

  useEffect(() => { generatedOutfitsRef.current = generatedOutfits; }, [generatedOutfits]);
  useEffect(() => { savedOutfitIdsRef.current = savedOutfitIds; }, [savedOutfitIds]);
  useEffect(() => { onSaveOutfitRef.current = onSaveOutfit; }, [onSaveOutfit]);

  useEffect(() => {
    return () => {
      const unsaved = generatedOutfitsRef.current.filter(o => !savedOutfitIdsRef.current.has(o.id));
      if (unsaved.length > 0) {
        // Auto-save history on unmount without nagging
        // Logic moved to parent usually, but simple safety check here
      }
    };
  }, []);

  const handleGetWeather = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLoadingWeather(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const data = await fetchWeather(position.coords.latitude, position.coords.longitude);
          setWeather(data);
        } catch (err) {
          setLocationError("Failed to fetch weather data");
        } finally {
          setLoadingWeather(false);
        }
      },
      () => {
        setLocationError("Location permission denied");
        setLoadingWeather(false);
      }
    );
  };

  const handleGenerate = async () => {
    if (wardrobe.length < 2) {
      alert("Please add at least a top and a bottom to your wardrobe first.");
      return;
    }
    setIsGenerating(true);
    setGeneratedOutfits([]);
    setSavedOutfitIds(new Set()); 

    try {
      const suggestions = await generateOutfitSuggestions(
        wardrobe, 
        selectedOccasion, 
        selectedStyle,
        weather
      );
      const fullOutfits: Outfit[] = suggestions.map((s: any) => ({
        id: crypto.randomUUID(),
        name: s.name,
        occasion: selectedOccasion,
        reasoning: s.reasoning,
        items: s.itemIds.map((id: string) => wardrobe.find(item => item.id === id)).filter((item: ClothingItem | undefined): item is ClothingItem => !!item)
      })).filter((o: Outfit) => o.items.length > 0);

      setGeneratedOutfits(fullOutfits);
      if (onAddToHistory) {
        onAddToHistory(fullOutfits);
      }
    } catch (error) {
      console.error(error);
      alert("Oops! AI couldn't generate outfits right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVisualize = async (outfit: Outfit) => {
    setGeneratingVisualId(outfit.id);
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

  const handleRate = async (outfit: Outfit) => {
    setRatingLoadingId(outfit.id);
    try {
      const ratingData = await rateOutfit(outfit.items, outfit.occasion);
      setGeneratedOutfits(prev => prev.map(o => 
        o.id === outfit.id ? { 
          ...o, 
          rating: ratingData.rating, 
          critique: ratingData.critique, 
          stylingTips: ratingData.stylingTips 
        } : o
      ));
    } catch (e) {
      console.error(e);
      alert("Couldn't get rating right now.");
    } finally {
      setRatingLoadingId(null);
    }
  };

  const handleLocalSave = (outfit: Outfit) => {
    if (savedOutfitIds.has(outfit.id)) return;
    onSaveOutfit(outfit);
    setSavedOutfitIds(prev => new Set(prev).add(outfit.id));
  };

  const openScheduleModal = (outfit: Outfit) => {
    setSchedulingOutfitId(outfit.id);
    // Default to today
    setScheduleDate(new Date().toISOString().split('T')[0]);
  };

  const confirmSchedule = () => {
    if (!schedulingOutfitId || !scheduleDate) return;
    const outfit = generatedOutfits.find(o => o.id === schedulingOutfitId);
    if (outfit) {
      onScheduleOutfit(outfit, scheduleDate);
      // Auto save if not saved
      handleLocalSave(outfit); 
      setSchedulingOutfitId(null);
      alert("Outfit scheduled successfully!");
    }
  };

  const handleShare = async (outfit: Outfit) => {
    const text = `🔥 DripFrame Fit Check: ${outfit.name}\n\n📅 Occasion: ${outfit.occasion}\n🧥 Items: ${outfit.items.map(i => i.category).join(', ')}\n💡 Vibe: ${outfit.reasoning}\n\nGenerated by DripFrame`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `DripFrame: ${outfit.name}`,
          text: text,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert('Outfit details copied to clipboard!');
      } catch (err) {
        alert('Failed to copy to clipboard');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#CCFF00] border border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 text-black">
        <h2 className="text-3xl font-black italic uppercase mb-2 flex items-center gap-2 tracking-tighter">
          <DripFrameIcon className="w-8 h-8 text-black" />
          DRIPFRAME
        </h2>
        <p className="text-black font-medium mb-6">Let DripFrame discover the best combinations from your closet.</p>
        
        {/* Weather Widget */}
        <div className="bg-white border border-black p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-black text-[#CCFF00] p-2">
               <CloudSun className="w-6 h-6" />
             </div>
             <div>
               <h3 className="font-black uppercase text-sm">Local Weather</h3>
               {weather ? (
                 <p className="text-sm font-bold text-gray-600">{weather.temperature}°C • {weather.description}</p>
               ) : (
                 <p className="text-xs text-gray-500 font-medium">Get weather for smarter suggestions</p>
               )}
             </div>
          </div>
          {!weather && (
             <button 
               onClick={handleGetWeather}
               disabled={loadingWeather}
               className="text-xs font-bold uppercase border border-black px-3 py-2 hover:bg-black hover:text-[#CCFF00] transition-colors flex items-center gap-2"
             >
               <div className="w-3 h-3 flex items-center justify-center">
                 {loadingWeather ? (
                   <Loader2 className="w-3 h-3 animate-spin" />
                 ) : (
                   <MapPin className="w-3 h-3" />
                 )}
               </div>
               Use My Location
             </button>
          )}
          {locationError && <p className="text-xs text-red-500 font-bold">{locationError}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Occasion Selector */}
          <div>
            <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Occasion</label>
            <select 
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full bg-white border border-black text-black px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black font-bold"
            >
              {OCCASIONS.map(occ => <option key={occ} value={occ} className="text-black">{occ}</option>)}
            </select>
          </div>

          {/* Style Selector */}
          <div>
             <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Style Preference</label>
             <select
               value={selectedStyle}
               onChange={(e) => setSelectedStyle(e.target.value as StyleType)}
               className="w-full bg-white border border-black text-black px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black font-bold"
             >
               {Object.values(StyleType).map((style) => (
                 <option key={style} value={style} className="text-black">{style}</option>
               ))}
             </select>
          </div>

          {/* Gender Selector */}
          <div>
             <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">Gender (for Preview)</label>
             <select
               value={selectedGender}
               onChange={(e) => setSelectedGender(e.target.value as Gender)}
               className="w-full bg-white border border-black text-black px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black font-bold"
             >
               {Object.values(Gender).map((g) => (
                 <option key={g} value={g} className="text-black">{g}</option>
               ))}
             </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-6 w-full bg-black text-[#CCFF00] font-black uppercase text-lg py-4 border-2 border-transparent hover:border-black hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm group"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-[#CCFF00] group-hover:text-black" />
              </div>
              <span>Mixing & Matching...</span>
            </div>
          ) : (
            <>
              <RefreshCcw className="w-6 h-6" />
              Generate Outfits
            </>
          )}
        </button>
      </div>

      {generatedOutfits.length > 0 && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-black uppercase">Recommended for You</h3>
          </div>
          
          <div className="grid gap-8" style={{ contentVisibility: 'auto' }}>
            {generatedOutfits.map((outfit) => {
              const isSaved = savedOutfitIds.has(outfit.id);
              return (
                <div key={outfit.id} className="bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                  <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                      <div>
                          <h4 className="font-black text-black text-2xl uppercase italic">{outfit.name}</h4>
                          <p className="text-sm font-bold text-gray-500">{outfit.items.length} items • {outfit.occasion}</p>
                      </div>
                      <div className="flex gap-2">
                          <button
                            onClick={() => handleShare(outfit)}
                            className="p-2 border border-black bg-white hover:bg-[#CCFF00] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                            title="Share Outfit"
                          >
                            <Share2 className="w-5 h-5 text-black" />
                          </button>
                          <button 
                              onClick={() => handleLocalSave(outfit)}
                              disabled={isSaved}
                              className={`flex items-center gap-2 px-4 py-2 border border-black transition-all ${
                                isSaved 
                                  ? 'bg-black text-[#CCFF00]' 
                                  : 'bg-[#CCFF00] text-black hover:bg-black hover:text-[#CCFF00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'
                              }`}
                          >
                              {isSaved ? <Check className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                          </button>
                          
                          <button 
                             onClick={() => openScheduleModal(outfit)}
                             className="px-4 py-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] flex items-center gap-2"
                             title="Schedule"
                          >
                             <CalendarPlus className="w-4 h-4" />
                          </button>
                      </div>
                      </div>
  
                      <div className="bg-gray-50 border-l-4 border-[#CCFF00] p-4 text-sm font-medium text-black italic mb-6">
                          " {outfit.reasoning} "
                      </div>
                      
                      {/* Outfit Visual Grid - Items */}
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                      {outfit.items.map((item) => (
                          <div key={item.id} className="flex-none w-28 snap-start">
                          <div className="aspect-square bg-white border border-black overflow-hidden mb-2">
                              <img src={item.imageUrl} alt={item.category} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs font-bold text-center text-black uppercase truncate">{item.category}</p>
                          </div>
                      ))}
                      </div>
  
                      <hr className="my-6 border-black/10" />
  
                      {/* AI Visualization Section */}
                      {outfit.generatedImageUrl ? (
                          <div className="mt-4">
                              <p className="text-xs font-black text-black uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <DripFrameIcon className="w-4 h-4 text-black" /> AI Virtual Try-On ({selectedGender})
                              </p>
                              <div className="relative aspect-[3/4] w-full max-w-sm mx-auto border border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                  <img 
                                      src={outfit.generatedImageUrl} 
                                      alt="AI generated look" 
                                      className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 right-2 bg-[#CCFF00] text-black border border-black text-[10px] font-bold px-2 py-1">
                                      DripFrame Generated
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <button 
                              onClick={() => handleVisualize(outfit)}
                              disabled={generatingVisualId === outfit.id}
                              className="w-full mt-2 py-3 border border-black bg-black text-[#CCFF00] font-black uppercase text-sm hover:bg-[#CCFF00] hover:text-black transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(204,255,0,0.5)] group"
                          >
                              {generatingVisualId === outfit.id ? (
                                  <div className="w-4 h-4 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#CCFF00] group-hover:text-black" />
                                  </div>
                              ) : (
                                  <ImageIcon className="w-4 h-4" />
                              )}
                              Visualize This Look (AI)
                          </button>
                      )}
  
                      {/* AI Rating & Tips Section */}
                      <div className="mt-6 pt-6 border-t border-black">
                        {outfit.rating ? (
                           <div className="bg-gray-50 p-4 border border-black">
                              <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-2">
                                    <div className="bg-black p-1">
                                      <Star className="w-4 h-4 text-[#CCFF00] fill-current" />
                                    </div>
                                    <span className="font-black text-black uppercase">Stylist Rating</span>
                                 </div>
                                 <div className="flex items-center gap-1 bg-white px-4 py-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="text-xl font-black text-black">{outfit.rating}</span>
                                    <span className="text-gray-500 text-xs font-bold">/ 10</span>
                                 </div>
                              </div>
                              
                              <p className="text-sm font-medium text-black mb-4 leading-relaxed">{outfit.critique}</p>
                              
                              {outfit.stylingTips && outfit.stylingTips.length > 0 && (
                                <div className="space-y-3">
                                   <p className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                                     <Lightbulb className="w-3 h-3" /> Styling Tips
                                   </p>
                                   <ul className="space-y-2">
                                      {outfit.stylingTips.map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-black font-medium">
                                          <CheckCircle2 className="w-4 h-4 text-[#CCFF00] fill-black shrink-0 mt-0.5" />
                                          <span>{tip}</span>
                                        </li>
                                      ))}
                                   </ul>
                                </div>
                              )}
                           </div>
                        ) : (
                           <button
                             onClick={() => handleRate(outfit)}
                             disabled={ratingLoadingId === outfit.id}
                             className="w-full py-3 border-2 border-black bg-white text-black font-bold uppercase text-sm hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                           >
                             {ratingLoadingId === outfit.id ? (
                               <div className="w-4 h-4 flex items-center justify-center">
                                 <Loader2 className="w-4 h-4 animate-spin text-black group-hover:text-[#CCFF00]" />
                               </div>
                             ) : (
                               <Star className="w-4 h-4 group-hover:text-[#CCFF00] transition-colors" />
                             )}
                             Get AI Rating & Styling Tips
                           </button>
                        )}
                      </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {schedulingOutfitId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black p-6 w-full max-w-sm shadow-[8px_8px_0px_0px_#CCFF00] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase text-xl italic tracking-tight">Schedule Drip</h3>
              <button onClick={() => setSchedulingOutfitId(null)} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
            </div>
            
            <label className="block text-xs font-black uppercase mb-2 tracking-wide">Select Date</label>
            <div className="relative mb-8">
              <input 
                type="date" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full bg-white border-2 border-black p-4 font-black uppercase text-lg text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all cursor-pointer"
                style={{ colorScheme: 'light' }}
              />
            </div>

            <button 
              onClick={confirmSchedule}
              className="w-full bg-black text-[#CCFF00] font-black uppercase py-4 text-lg hover:bg-[#CCFF00] hover:text-black border-2 border-transparent hover:border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Confirm Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitGenerator;
