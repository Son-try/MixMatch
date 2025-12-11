export enum ClothingCategory {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  SHOES = 'Shoes',
  OUTERWEAR = 'Outerwear',
  ACCESSORY = 'Accessory',
  OTHER = 'Other'
}

export enum StyleType {
  CASUAL = 'Casual',
  FORMAL = 'Formal',
  STREETWEAR = 'Streetwear',
  VINTAGE = 'Vintage',
  SPORTY = 'Sporty',
  MINIMALIST = 'Minimalist'
}

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  UNISEX = 'Unisex'
}

export interface ClothingItem {
  id: string;
  imageUrl: string;
  category: ClothingCategory;
  color: string;
  style: StyleType;
  description: string;
}

export interface Outfit {
  id: string;
  name: string;
  items: ClothingItem[];
  occasion: string;
  reasoning: string;
  generatedImageUrl?: string; // New field for the visualization
  rating?: number; // AI Rating score (1-10)
  critique?: string; // AI Fashion critique
  stylingTips?: string[]; // List of specific styling tips
  scheduledDate?: string; // ISO Date string (YYYY-MM-DD)
}

export interface UserProfile {
  name: string;
  favoriteStyles: StyleType[];
  favoriteColors: string[];
}

export interface WeatherData {
  temperature: number;
  description: string;
  isRaining: boolean;
  isSnowing: boolean;
}
