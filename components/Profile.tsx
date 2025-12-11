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
      // Simple single selection logic for MVP simplicity, or multi-select
      newStyles = [style]; 
    }
    setProfile({ ...profile, favoriteStyles: newStyles });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          <User className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fashion Enthusiast</h2>
          <p className="text-gray-500 text-sm">Update your style preferences to get better recommendations.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">What's your vibe?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.values(StyleType).map((style) => {
            const isSelected = profile.favoriteStyles.includes(style);
            return (
              <button
                key={style}
                onClick={() => toggleStyle(style)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' 
                    : 'border-gray-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>{style}</span>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> MixMatch uses these preferences to guide the AI when generating outfits for you.
        </p>
      </div>
    </div>
  );
};

export default Profile;