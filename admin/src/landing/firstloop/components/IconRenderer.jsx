import React from 'react';
import { 
  Coffee, Dumbbell, ShoppingBag, Sparkles, Utensils, Star, Award, 
  Scissors, Heart, Dog, Zap, Crown, User, ShieldCheck, Tag
} from 'lucide-react';

export const IconRenderer = ({ name, className = "w-5 h-5", style = {} }) => {
  switch (name?.toLowerCase()) {
    case 'coffee':
    case '☕':
      return <Coffee className={className} style={style} />;
    case 'fitness':
    case 'gym':
    case '⚡':
    case '🏋️‍♂️':
      return <Dumbbell className={className} style={style} />;
    case 'fashion':
    case 'shopping':
    case '✨':
    case '🛍️':
      return <ShoppingBag className={className} style={style} />;
    case 'beauty':
    case 'spa':
    case '🌸':
    case '💆‍♀️':
      return <Scissors className={className} style={style} />;
    case 'restaurant':
    case 'food':
    case '🍷':
    case '🍕':
    case '🍔':
      return <Utensils className={className} style={style} />;
    case 'pet':
    case '🐾':
      return <Dog className={className} style={style} />;
    case 'star':
    case '⭐':
      return <Star className={className} style={style} />;
    case 'crown':
    case 'vip':
      return <Crown className={className} style={style} />;
    default:
      return <Sparkles className={className} style={style} />;
  }
};
