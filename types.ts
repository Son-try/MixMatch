
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
}

export interface UserProfile {
  name: string;
  favoriteStyles: StyleType[];
  favoriteColors: string[];
}
