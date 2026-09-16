export interface CropItem {
  id: string;
  name: string;
  localName: string; // Sinhala/Tamil hint
  category: "Grains & Cereals" | "Vegetables" | "Tubers & Legumes" | "Cash Crops" | "Fruits";
  emoji: string;
  typicalDurationDays: number;
}

export const CROPS_CATALOG: CropItem[] = [
  // Grains & Cereals
  { id: "Maize", name: "Maize / Corn", localName: "බඩඉරිඟු / சோளம்", category: "Grains & Cereals", emoji: "🌽", typicalDurationDays: 110 },
  { id: "Paddy", name: "Paddy (Rice)", localName: "වී (ගොයම්) / நெல்", category: "Grains & Cereals", emoji: "🌾", typicalDurationDays: 120 },
  { id: "Kurakkan", name: "Finger Millet (Kurakkan)", localName: "කුරක්කන් / கேழ்வரகு", category: "Grains & Cereals", emoji: "🌾", typicalDurationDays: 100 },
  { id: "Sorghum", name: "Sorghum", localName: "ඉදල් ඉරිඟු / சோளம்", category: "Grains & Cereals", emoji: "🌾", typicalDurationDays: 110 },

  // Vegetables
  { id: "Tomato", name: "Tomato", localName: "තක්කාලි / தக்காளி", category: "Vegetables", emoji: "🍅", typicalDurationDays: 90 },
  { id: "Chili", name: "Chili", localName: "මිරිස් / மிளகாய்", category: "Vegetables", emoji: "🌶️", typicalDurationDays: 120 },
  { id: "Brinjal", name: "Eggplant (Brinjal)", localName: "වම්බටු / கத்தரிக்காய்", category: "Vegetables", emoji: "🍆", typicalDurationDays: 110 },
  { id: "Okra", name: "Okra (Ladies' Finger)", localName: "බණ්ඩක්කා / வெண்டைக்காய்", category: "Vegetables", emoji: "🥗", typicalDurationDays: 80 },
  { id: "Cabbage", name: "Cabbage", localName: "ගෝවා / முட்டைக்கோஸ்", category: "Vegetables", emoji: "🥬", typicalDurationDays: 90 },
  { id: "Carrot", name: "Carrot", localName: "කැරට් / கேரட்", category: "Vegetables", emoji: "🥕", typicalDurationDays: 90 },
  { id: "Pumpkin", name: "Pumpkin", localName: "වට්ටක්කා / பூசணிக்காய்", category: "Vegetables", emoji: "🎃", typicalDurationDays: 100 },
  { id: "BitterGourd", name: "Bitter Gourd", localName: "කරවිල / பாகற்காய்", category: "Vegetables", emoji: "🥒", typicalDurationDays: 90 },

  // Tubers & Legumes
  { id: "Potato", name: "Potato", localName: "අර්තාපල් / உருளைக்கிழங்கு", category: "Tubers & Legumes", emoji: "🥔", typicalDurationDays: 100 },
  { id: "SweetPotato", name: "Sweet Potato", localName: "බතල / சர்க்கரைவள்ளிக்கிழங்கு", category: "Tubers & Legumes", emoji: "🍠", typicalDurationDays: 110 },
  { id: "MungBean", name: "Green Gram (Mung Bean)", localName: "මුං ඇට / பாசிப்பயறு", category: "Tubers & Legumes", emoji: "🫘", typicalDurationDays: 75 },
  { id: "Cowpea", name: "Cowpea", localName: "කවුපි / தட்டப்பயறு", category: "Tubers & Legumes", emoji: "🫘", typicalDurationDays: 80 },
  { id: "Peanut", name: "Groundnut (Peanut)", localName: "රටකජු / நிலக்கடலை", category: "Tubers & Legumes", emoji: "🥜", typicalDurationDays: 100 },
  { id: "Cassava", name: "Manioc (Cassava)", localName: "මඤ්ඤොක්කා / மரவள்ளிக்கிழங்கு", category: "Tubers & Legumes", emoji: "🌱", typicalDurationDays: 240 },

  // Cash Crops
  { id: "BigOnion", name: "Big Onion", localName: "ලොකු ලූනු / பெரிய வெங்காயம்", category: "Cash Crops", emoji: "🧅", typicalDurationDays: 95 },
  { id: "RedOnion", name: "Red Onion", localName: "රතු ලූනු / சின்ன வெங்காயம்", category: "Cash Crops", emoji: "🧅", typicalDurationDays: 70 },
  { id: "Banana", name: "Banana", localName: "කෙසෙල් / வாழைப்பழம்", category: "Cash Crops", emoji: "🍌", typicalDurationDays: 300 },
];
