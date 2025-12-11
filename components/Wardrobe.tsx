
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Loader2, Tag, Trash2, Camera, X, Image as ImageIcon, Upload } from 'lucide-react';
import { ClothingItem, ClothingCategory, StyleType } from '../types';
import { analyzeClothingImage } from '../services/geminiService';

interface WardrobeProps {
  items: ClothingItem[];
  setItems: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
}

const Wardrobe: React.FC<WardrobeProps> = ({ items, setItems }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingCount, setAnalyzingCount] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<string>('All');
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Handle Multiple File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsAnalyzing(true);
    setAnalyzingCount({ current: 0, total: files.length });
    
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      setAnalyzingCount(prev => ({ ...prev, current: i + 1 }));
      await processFile(fileArray[i]);
    }

    setIsAnalyzing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = (file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        try {
          const analysis = await analyzeClothingImage(base64Data);
          const newItem: ClothingItem = {
            id: crypto.randomUUID(),
            imageUrl: base64String,
            category: (analysis.category as ClothingCategory) || ClothingCategory.OTHER,
            color: analysis.color || 'Unknown',
            style: (analysis.style as StyleType) || StyleType.CASUAL,
            description: analysis.description || 'New Item',
          };
          setItems(prev => [newItem, ...prev]);
        } catch (error) {
          console.error("Error analyzing item", error);
        } finally {
          resolve();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Camera Logic
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Prefer back camera on mobile
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      // Wait for video element to update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      // Stop camera immediately after capture
      stopCamera();
      
      // Analyze
      setIsAnalyzing(true);
      setAnalyzingCount({ current: 1, total: 1 });
      
      const base64Data = dataUrl.split(',')[1];
      try {
        const analysis = await analyzeClothingImage(base64Data);
        const newItem: ClothingItem = {
          id: crypto.randomUUID(),
          imageUrl: dataUrl,
          category: (analysis.category as ClothingCategory) || ClothingCategory.OTHER,
          color: analysis.color || 'Unknown',
          style: (analysis.style as StyleType) || StyleType.CASUAL,
          description: analysis.description || 'New Item',
        };
        setItems(prev => [newItem, ...prev]);
      } catch (error) {
        alert("Failed to analyze captured image.");
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredItems = filter === 'All' 
    ? items 
    : items.filter(item => item.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Wardrobe</h2>
          <p className="text-sm text-gray-500">{items.length} items collected</p>
        </div>
        
        <div className="flex gap-2">
           <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing || isCameraOpen}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            <span>Upload</span>
          </button>
          
          <button
            onClick={startCamera}
            disabled={isAnalyzing || isCameraOpen}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            <span>Camera</span>
          </button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple // ALLOW MULTIPLE
          onChange={handleFileUpload}
        />
      </div>

      {/* Progress Indicator */}
      {isAnalyzing && analyzingCount.total > 0 && (
         <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">
              Analyzing items... ({analyzingCount.current} / {analyzingCount.total})
            </span>
         </div>
      )}

      {/* Camera View Modal/Overlay */}
      {isCameraOpen && (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] md:aspect-video shadow-xl border-4 border-indigo-100">
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
           />
           <canvas ref={canvasRef} className="hidden" />
           
           <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8">
              <button 
                onClick={stopCamera}
                className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white hover:bg-white/30 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <button 
                onClick={capturePhoto}
                className="bg-white p-1.5 rounded-full border-4 border-indigo-500/50 hover:scale-105 transition-transform"
              >
                 <div className="w-14 h-14 bg-white rounded-full border-2 border-gray-300" />
              </button>
           </div>
        </div>
      )}

      {/* Categories Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {['All', ...Object.values(ClothingCategory)].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === cat 
                ? 'bg-gray-900 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {items.length === 0 && !isCameraOpen ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Your closet is empty</h3>
          <p className="text-gray-500 mt-1 max-w-xs mx-auto">Upload photos or use the camera to start.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="group relative bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img src={item.imageUrl} alt={item.description} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-gray-900 truncate text-sm">{item.category}</h4>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium uppercase tracking-wider">
                    {item.style}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 capitalize truncate">{item.color} • {item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wardrobe;
