import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Tag, Camera, X, Image as ImageIcon, Upload, Palette, Search, Edit2, Save, Trash2, Box } from 'lucide-react';
import { ClothingItem, ClothingCategory, StyleType } from '../types';
import { analyzeClothingImage } from '../services/geminiService';

interface WardrobeProps {
  items: ClothingItem[];
  setItems: React.Dispatch<React.SetStateAction<ClothingItem[]>>;
}

// Optimization: Memoize the individual item card to prevent unnecessary re-renders
const WardrobeItemCard = React.memo(({ 
  item, 
  onClick, 
  onDelete 
}: { 
  item: ClothingItem, 
  onClick: (item: ClothingItem) => void,
  onDelete: (id: string) => void
}) => {
  return (
    <div 
      onClick={() => onClick(item)}
      className="group relative bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-transform will-change-transform cursor-pointer"
    >
      {/* Delete Button - Absolute Positioned */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // CRITICAL: Stop event bubbling to prevent opening modal
          onDelete(item.id);
        }}
        className="absolute top-2 right-2 z-20 bg-white border border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        title="Delete Item"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="aspect-square bg-gray-100 relative overflow-hidden border-b border-black">
        {/* Optimization: Add lazy loading and decoding async */}
        <img 
          src={item.imageUrl} 
          alt={item.description} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white text-black px-3 py-1 font-bold text-xs border border-black shadow-[2px_2px_0px_0px_#CCFF00]">
              View Details
            </div>
        </div>
      </div>
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <span className="text-xs font-black uppercase tracking-wider text-black bg-[#CCFF00] px-2 py-0.5 border border-black truncate max-w-full">{item.category}</span>
        </div>
        <p className="text-sm font-bold text-black line-clamp-1">{item.description}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
          <span className="flex items-center gap-1 font-medium truncate"><Palette className="w-3 h-3 flex-shrink-0" /> {item.color}</span>
          <span className="flex items-center gap-1 border-l border-black pl-2 font-medium truncate"><Tag className="w-3 h-3 flex-shrink-0" /> {item.style}</span>
        </div>
      </div>
    </div>
  );
});

const Wardrobe: React.FC<WardrobeProps> = ({ items, setItems }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingCount, setAnalyzingCount] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState<string>('All');
  const [styleFilter, setStyleFilter] = useState<string>('All');
  const [colorFilter, setColorFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drag & Drop State
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // View/Edit State
  const [viewingItem, setViewingItem] = useState<ClothingItem | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [editForm, setEditForm] = useState<ClothingItem | null>(null);

  // Optimization: Resize and compress image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // OPTIMIZATION: Reduced max size from 1024 to 800 for lower memory usage
          const MAX_SIZE = 800; 

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // OPTIMIZATION: Lowered quality to 0.6 for smaller base64 strings
            const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
            resolve(dataUrl);
          } else {
            reject(new Error('Canvas context failed'));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    try {
      // Use compressed image base64
      const base64Data = await compressImage(file);
      const base64String = base64Data.split(',')[1];
      const analysis = await analyzeClothingImage(base64String);

      const newItem: ClothingItem = {
        id: crypto.randomUUID(),
        imageUrl: base64Data, 
        category: (analysis.category as ClothingCategory) || ClothingCategory.OTHER,
        color: analysis.color || 'Unknown',
        style: (analysis.style as StyleType) || StyleType.CASUAL,
        description: analysis.description || 'No description',
      };

      setItems(prev => [newItem, ...prev]);
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to analyze image. Please try again.");
    }
  };

  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsAnalyzing(true);
    setAnalyzingCount({ current: 0, total: files.length });
    const fileArray: File[] = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      setAnalyzingCount(prev => ({ ...prev, current: i + 1 }));
      await processFile(fileArray[i]);
    }
    setIsAnalyzing(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    if (e.dataTransfer.files?.length > 0) processFiles(e.dataTransfer.files);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      alert("Cannot access camera.");
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            setIsAnalyzing(true);
            setAnalyzingCount({ current: 1, total: 1 });
            await processFile(file);
            setIsAnalyzing(false);
            stopCamera();
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleCloseModal = useCallback(() => {
    setViewingItem(null);
    setEditForm(null);
    setIsEditingMode(false);
  }, []);

  const openViewModal = useCallback((item: ClothingItem) => {
    setViewingItem(item);
    setEditForm(item);
    setIsEditingMode(false);
  }, []);

  // Simplified Delete Logic
  const handleDeleteItem = useCallback((id: string) => {
    // Directly remove item from state (no confirm)
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    
    // If the item being deleted is currently open in modal, close it
    if (viewingItem?.id === id) {
      handleCloseModal();
    }
  }, [viewingItem, handleCloseModal, setItems]);

  const handleSaveEdit = () => {
    if (editForm) {
      setItems(prev => prev.map(item => item.id === editForm.id ? editForm : item));
      handleCloseModal();
    }
  };

  // Optimization: Memoize filtering logic
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesCategory = filter === 'All' || item.category === filter;
      const matchesStyle = styleFilter === 'All' || item.style === styleFilter;
      const matchesColor = colorFilter === 'All' || item.color.toLowerCase().includes(colorFilter.toLowerCase());
      const matchesSearch = item.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.style.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesStyle && matchesColor && matchesSearch;
    });
  }, [items, filter, styleFilter, colorFilter, searchQuery]);

  const availableColors = useMemo(() => {
    return Array.from(new Set(items.map(i => i.color))).sort();
  }, [items]);

  return (
    <div className="space-y-6">
      
      {/* Filters & Search - MOVED TO TOP */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors items-start md:items-center">
        {/* Total Items Badge */}
        <div className="bg-black text-[#CCFF00] px-3 py-2 font-black border border-black text-sm whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(204,255,0,0.5)] flex items-center gap-2">
          <Box className="w-4 h-4" />
          TOTAL: {items.length}
        </div>

        <div className="flex-1 relative w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black w-4 h-4" />
           <input 
             type="text" 
             placeholder="Search items..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full pl-9 pr-4 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black placeholder-gray-500 font-medium"
           />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 w-full md:w-auto">
           <select 
             value={filter} 
             onChange={(e) => setFilter(e.target.value)}
             className="px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black cursor-pointer font-bold"
           >
             <option value="All">All Categories</option>
             {Object.values(ClothingCategory).map(c => <option key={c} value={c}>{c}</option>)}
           </select>

           <select 
             value={styleFilter} 
             onChange={(e) => setStyleFilter(e.target.value)}
             className="px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black cursor-pointer font-bold"
           >
             <option value="All">All Styles</option>
             {Object.values(StyleType).map(s => <option key={s} value={s}>{s}</option>)}
           </select>
           
           <select 
             value={colorFilter} 
             onChange={(e) => setColorFilter(e.target.value)}
             className="px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black cursor-pointer max-w-[150px] font-bold"
           >
             <option value="All">All Colors</option>
             {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className={`relative border-2 border-dashed p-8 transition-all text-center ${
          isDragOver 
            ? 'border-[#CCFF00] bg-[#CCFF00]/10' 
            : 'border-black hover:border-[#CCFF00] bg-white'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileUpload} 
          className="hidden" 
          multiple 
          accept="image/*"
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="bg-[#CCFF00] border border-black p-4 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {isAnalyzing ? (
              <Loader2 className="w-8 h-8 text-black animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-black" />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-black uppercase italic text-black">
              {isAnalyzing 
                ? `Analyzing Item ${analyzingCount.current} of ${analyzingCount.total}...` 
                : "Add to Wardrobe"
              }
            </h3>
            <p className="text-gray-600 text-sm mt-1 font-medium">
              Drag & drop photos here or click to upload
            </p>
          </div>

          {!isAnalyzing && (
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-black text-white px-5 py-2 font-bold hover:bg-[#CCFF00] hover:text-black transition-colors shadow-sm flex items-center gap-2 border border-black"
              >
                <ImageIcon className="w-4 h-4" /> Upload Photo
              </button>
              <button 
                onClick={startCamera}
                className="bg-white text-black border border-black px-5 py-2 font-bold hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4" /> Take Photo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wardrobe Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium">No items found. Upload some clothes to get started!</p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          style={{ contentVisibility: 'auto' }} 
        >
          {filteredItems.map(item => (
            <WardrobeItemCard 
              key={item.id} 
              item={item} 
              onClick={openViewModal} 
              onDelete={handleDeleteItem}
            />
          ))}
        </div>
      )}

      {/* View/Edit Detail Modal */}
      {viewingItem && editForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black w-full max-w-lg shadow-[8px_8px_0px_0px_#CCFF00] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b-2 border-black flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-black text-black uppercase text-lg">
                {isEditingMode ? 'Edit Item' : 'Item Details'}
              </h3>
              <div className="flex gap-2">
                {!isEditingMode && (
                   <button 
                     onClick={() => setIsEditingMode(true)}
                     className="p-1.5 hover:bg-[#CCFF00] border border-transparent hover:border-black transition-all"
                     title="Edit"
                   >
                     <Edit2 className="w-5 h-5 text-black" />
                   </button>
                )}
                <button 
                  onClick={handleCloseModal}
                  className="p-1.5 hover:text-red-500 hover:rotate-90 transition-all"
                  title="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {/* Image Section */}
              <div className="flex justify-center mb-6">
                <div className="w-48 h-48 border-2 border-black overflow-hidden bg-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <img src={viewingItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              {isEditingMode ? (
                // EDIT MODE FORM
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase mb-1">Category</label>
                    <select 
                      value={editForm.category} 
                      onChange={(e) => setEditForm({...editForm, category: e.target.value as ClothingCategory})}
                      className="w-full px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black font-medium"
                    >
                      {Object.values(ClothingCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase mb-1">Style</label>
                    <select 
                      value={editForm.style} 
                      onChange={(e) => setEditForm({...editForm, style: e.target.value as StyleType})}
                      className="w-full px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black font-medium"
                    >
                      {Object.values(StyleType).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase mb-1">Color</label>
                    <input 
                      type="text" 
                      value={editForm.color}
                      onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase mb-1">Description</label>
                    <input 
                      type="text" 
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-black text-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-black font-medium"
                    />
                  </div>
                </div>
              ) : (
                // VIEW MODE DETAILS
                <div className="space-y-4 border-t border-black pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Category</p>
                      <p className="text-black font-black text-lg">{viewingItem.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Style</p>
                      <p className="text-black font-black text-lg">{viewingItem.style}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Color</p>
                      <p className="text-black font-bold">{viewingItem.color}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Description</p>
                    <p className="text-black font-medium italic">"{viewingItem.description}"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-black bg-gray-50 shrink-0 flex gap-3">
              {isEditingMode ? (
                  <>
                    <button 
                      onClick={() => setIsEditingMode(false)}
                      className="flex-1 bg-white text-black py-3 font-bold uppercase border border-black hover:bg-gray-100 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-black text-[#CCFF00] py-3 font-black uppercase tracking-wider hover:bg-[#CCFF00] hover:text-black hover:border-black border border-transparent hover:border-black transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </>
              ) : (
                <button 
                  onClick={() => handleDeleteItem(viewingItem.id)}
                  className="w-full bg-red-500 text-white py-3 font-black uppercase tracking-wider hover:bg-red-600 border-2 border-transparent hover:border-black transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  <Trash2 className="w-4 h-4" /> Delete Item
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-black border border-[#CCFF00] overflow-hidden shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-auto aspect-[3/4] object-cover bg-gray-900" />
            <canvas ref={canvasRef} className="hidden" />
            
            <button 
              onClick={stopCamera}
              className="absolute top-4 right-4 text-white p-2 bg-black/50 hover:bg-[#CCFF00] hover:text-black transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center bg-gradient-to-t from-black/80 to-transparent">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-[#CCFF00] flex items-center justify-center hover:bg-[#CCFF00]/20 transition-colors"
              >
                <div className="w-14 h-14 bg-[#CCFF00] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wardrobe;
