import { 
  Utensils, Coffee, Pizza, Soup, Sandwich, IceCream, 
  Beer, Flame, Beef, Carrot, CakeSlice, Fish, 
  Drumstick, Wine, Salad, Croissant, Wheat,
  LucideIcon 
} from "lucide-react";

export const iconMap: Record<string, LucideIcon> = {
  "Utensils": Utensils,
  "Flame": Flame,
  "Coffee": Coffee,
  "Pizza": Pizza,
  "Soup": Soup,
  "Sandwich": Sandwich,
  "IceCream": IceCream,
  "Beer": Beer,
  "Beef": Beef,
  "Drumstick": Drumstick,
  "Fish": Fish,
  "Carrot": Carrot,
  "Salad": Salad,
  "CakeSlice": CakeSlice,
  "Wine": Wine,
  "Croissant": Croissant,
  "Wheat": Wheat
};

export const getIconComponent = (iconName?: string) => {
  if (!iconName || !iconMap[iconName]) return Utensils;
  return iconMap[iconName];
};