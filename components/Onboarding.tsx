import React, { useState } from 'react';
import { Camera, RefreshCcw, Calendar, X, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "DIGITIZE YOUR CLOSET",
      desc: "Upload photos of your clothes. DripFrame's AI will automatically categorize and tag them for you.",
      icon: <Camera className="w-12 h-12 text-[#CCFF00]" />,
    },
    {
      title: "GET WEATHER-SMART FITS",
      desc: "Generate outfit ideas based on the occasion and your local weather. No more freezing in style.",
      icon: <RefreshCcw className="w-12 h-12 text-[#CCFF00]" />,
    },
    {
      title: "PLAN YOUR DRIP",
      desc: "Schedule your outfits on the calendar. Visualize your look with AI before you wear it.",
      icon: <Calendar className="w-12 h-12 text-[#CCFF00]" />,
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white border-2 border-[#CCFF00] max-w-md w-full shadow-[8px_8px_0px_0px_#CCFF00] p-8 relative overflow-hidden">
        
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 text-gray-400 hover:text-black hover:rotate-90 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10">
          <div className="bg-black w-20 h-20 flex items-center justify-center border-2 border-[#CCFF00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6">
            {steps[step].icon}
          </div>

          <div className="flex gap-1 mb-4">
             {steps.map((_, i) => (
               <div key={i} className={`h-2 flex-1 border border-black transition-colors ${i <= step ? 'bg-[#CCFF00]' : 'bg-gray-100'}`} />
             ))}
          </div>

          <h2 className="text-3xl font-black uppercase italic mb-4 leading-none tracking-tighter">
            {steps[step].title}
          </h2>
          <p className="text-gray-600 font-medium mb-8 leading-relaxed">
            {steps[step].desc}
          </p>

          <button 
            onClick={handleNext}
            className="w-full bg-black text-[#CCFF00] font-black uppercase py-4 text-lg hover:bg-[#CCFF00] hover:text-black border-2 border-transparent hover:border-black transition-all flex items-center justify-center gap-2 group"
          >
            {step === steps.length - 1 ? "Start Styling" : "Next"}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
