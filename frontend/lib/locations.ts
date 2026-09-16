export interface LocationPreset {
  name: string;
  district: string;
  province: string;
  latitude: number;
  longitude: number;
  isPopular?: boolean;
}

export const SRI_LANKA_LOCATIONS: LocationPreset[] = [
  // North Central
  { name: "Anuradhapura", district: "Anuradhapura", province: "North Central", latitude: 8.3114, longitude: 80.4037, isPopular: true },
  { name: "Kekirawa", district: "Anuradhapura", province: "North Central", latitude: 8.0415, longitude: 80.5925 },
  { name: "Thambuttegama", district: "Anuradhapura", province: "North Central", latitude: 8.1568, longitude: 80.3012 },
  { name: "Polonnaruwa", district: "Polonnaruwa", province: "North Central", latitude: 7.9403, longitude: 81.0188, isPopular: true },
  { name: "Hingurakgoda", district: "Polonnaruwa", province: "North Central", latitude: 8.0494, longitude: 80.9782 },
  { name: "Medirigiriya", district: "Polonnaruwa", province: "North Central", latitude: 8.1518, longitude: 81.0152 },

  // Central
  { name: "Dambulla", district: "Matale", province: "Central", latitude: 7.8742, longitude: 80.6511, isPopular: true },
  { name: "Matale", district: "Matale", province: "Central", latitude: 7.4675, longitude: 80.6234 },
  { name: "Kandy", district: "Kandy", province: "Central", latitude: 7.2906, longitude: 80.6337, isPopular: true },
  { name: "Nuwara Eliya", district: "Nuwara Eliya", province: "Central", latitude: 6.9497, longitude: 80.7891, isPopular: true },
  { name: "Welimada", district: "Badulla", province: "Uva", latitude: 6.9034, longitude: 80.9022 },
  { name: "Bandarawela", district: "Badulla", province: "Uva", latitude: 6.8258, longitude: 80.9982 },
  { name: "Badulla", district: "Badulla", province: "Uva", latitude: 6.9934, longitude: 81.0550 },
  { name: "Mahiyanganaya", district: "Badulla", province: "Uva", latitude: 7.3167, longitude: 81.0000 },

  // North
  { name: "Jaffna", district: "Jaffna", province: "Northern", latitude: 9.6615, longitude: 80.0255, isPopular: true },
  { name: "Kilinochchi", district: "Kilinochchi", province: "Northern", latitude: 9.3803, longitude: 80.3770 },
  { name: "Vavuniya", district: "Vavuniya", province: "Northern", latitude: 8.7542, longitude: 80.4982 },
  { name: "Mannar", district: "Mannar", province: "Northern", latitude: 8.9810, longitude: 79.9044 },
  { name: "Mullaitivu", district: "Mullaitivu", province: "Northern", latitude: 9.2671, longitude: 80.8142 },

  // North Western
  { name: "Kurunegala", district: "Kurunegala", province: "North Western", latitude: 7.4863, longitude: 80.3623, isPopular: true },
  { name: "Nikaweratiya", district: "Kurunegala", province: "North Western", latitude: 7.7512, longitude: 80.1165 },
  { name: "Puttalam", district: "Puttalam", province: "North Western", latitude: 8.0362, longitude: 79.8283 },
  { name: "Kalpitiya", district: "Puttalam", province: "North Western", latitude: 8.2325, longitude: 79.7618 },

  // Eastern
  { name: "Ampara", district: "Ampara", province: "Eastern", latitude: 7.2912, longitude: 81.6724 },
  { name: "Batticaloa", district: "Batticaloa", province: "Eastern", latitude: 7.7310, longitude: 81.6747 },
  { name: "Trincomalee", district: "Trincomalee", province: "Eastern", latitude: 8.5874, longitude: 81.2152 },
  { name: "Kantale", district: "Trincomalee", province: "Eastern", latitude: 8.3654, longitude: 80.9934 },

  // Southern & Sabaragamuwa
  { name: "Hambantota", district: "Hambantota", province: "Southern", latitude: 6.1429, longitude: 81.1212 },
  { name: "Embilipitiya", district: "Ratnapura", province: "Sabaragamuwa", latitude: 6.3421, longitude: 80.8504 },
  { name: "Monaragala", district: "Monaragala", province: "Uva", latitude: 6.8728, longitude: 81.3507 },
  { name: "Ratnapura", district: "Ratnapura", province: "Sabaragamuwa", latitude: 6.6828, longitude: 80.4037 },
  { name: "Matara", district: "Matara", province: "Southern", latitude: 5.9549, longitude: 80.5550 },
  { name: "Galle", district: "Galle", province: "Southern", latitude: 6.0535, longitude: 80.2210 },
  { name: "Colombo", district: "Colombo", province: "Western", latitude: 6.9271, longitude: 79.8612 },
  { name: "Gampaha", district: "Gampaha", province: "Western", latitude: 7.0840, longitude: 79.9939 },
  { name: "Kalutara", district: "Kalutara", province: "Western", latitude: 6.5854, longitude: 79.9607 },
];
