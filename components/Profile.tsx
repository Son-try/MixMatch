import React from 'react';
import { UserProfile, StyleType } from '../types';
import { User, Check } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  
  const toggleStyle = (style: StyleType) => {
    const current = profile.favoriteStyles;
    let newStyles;
    if (current.includes(style)) {
      newStyles = current.filter(s => s !== style);
    } else {
      newStyles = [style]; 
    }
    setProfile({ ...profile, favoriteStyles: newStyles });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 bg-white p-6 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-16 h-16 bg-[#CCFF00] border border-black flex items-center justify-center text-black">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black uppercase italic">Fashion Enthusiast</h2>
          <p className="text-gray-600 font-medium text-sm">Update your style preferences to get better recommendations.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-black uppercase">What's your vibe?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(StyleType).map((style) => {
            const isSelected = profile.favoriteStyles.includes(style);
            return (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`p-4 border-2 text-left transition-all relative overflow-hidden ${
                  isSelected 
                    ? 'border-black bg-[#CCFF00] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-black bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-bold uppercase ${isSelected ? 'text-black' : 'text-gray-800'}`}>{style}</span>
                  {/* Made checklist icon thicker */}
                  {isSelected && <Check className="w-5 h-5 text-black" strokeWidth={4} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-black text-[#CCFF00] border border-black p-4 shadow-[4px_4px_0px_0px_#CCFF00]">
        <p className="text-sm font-bold">
          <strong>TIP:</strong> DripFrame uses these preferences to guide the AI when generating outfits for you.
        </p>
      </div>
    </div>
  );
};

export default Profile;
