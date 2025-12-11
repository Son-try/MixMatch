
import React from 'react';
import { Outfit } from '../types';
import { Heart, Trash2, Sparkles } from 'lucide-react';

interface SavedOutfitsProps {
  outfits: Outfit[];
  onDelete: (id: string) => void;
}

const SavedOutfits: React.FC<SavedOutfitsProps> = ({ outfits, onDelete }) => {
  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <Heart className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">No favorites yet</h2>
        <p className="text-gray-500 mt-2 max-w-xs">Save outfits from the generator to build your personal lookbook.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-900">My Favorites</h2>
       <div className="grid gap-6">
        {outfits.map((outfit) => (
          <div key={outfit.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-gray-900">{outfit.name}</h3>
                  <span className="text-xs text-gray-500 bg-white border px-2 py-0.5 rounded-full">{outfit.occasion}</span>
               </div>
               <button 
                onClick={() => onDelete(outfit.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-4">
               {/* Items Grid */}
               <div className="flex -space-x-4 overflow-hidden py-2 px-2 mb-3">
                 {outfit.items.map((item, i) => (
                   <div key={item.id} className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-gray-100 overflow-hidden relative z-[10]" style={{ zIndex: 10 - i}}>
                     <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                   </div>
                 ))}
               </div>
               <p className="text-sm text-gray-600 line-clamp-2 italic">"{outfit.reasoning}"</p>

               {/* Generated Visual Display */}
               {outfit.generatedImageUrl && (
                 <div className="mt-4 border-t border-gray-100 pt-3">
                   <div className="flex items-center gap-1.5 mb-2">
                     <Sparkles className="w-3 h-3 text-indigo-500" />
                     <span className="text-xs font-bold text-gray-700 uppercase">AI Lookbook</span>
                   </div>
                   <div className="h-48 w-full rounded-xl overflow-hidden bg-gray-100">
                      <img src={outfit.generatedImageUrl} alt="Lookbook" className="w-full h-full object-cover object-top" />
                   </div>
                 </div>
               )}
            </div>
          </div>
        ))}
       </div>
    </div>
  );
};

export default SavedOutfits;
