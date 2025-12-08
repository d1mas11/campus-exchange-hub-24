export interface User {
  id: string;
  email: string;
  name: string;
  university: string;
  profilePicture?: string;
  languages: string[];
  createdAt: Date;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerUniversity: string;
  sellerLanguages: string[];
  sellerAvatar?: string;
  createdAt: Date;
  isFavorite?: boolean;
}

export type Category = 
  | 'textbooks'
  | 'electronics'
  | 'furniture'
  | 'clothing'
  | 'sports'
  | 'kitchen'
  | 'bathroom'
  | 'shoes'
  | 'other';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  itemId?: string;
}

export interface Chat {
  id: string;
  participantIds: string[];
  participants: User[];
  lastMessage?: Message;
  itemId?: string;
  item?: Item;
}

export const CATEGORIES: { value: Category; label: string; icon: string }[] = [
  { value: 'textbooks', label: 'Textbooks', icon: '📚' },
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' },
  { value: 'clothing', label: 'Clothing', icon: '👕' },
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { value: 'bathroom', label: 'Bathroom', icon: '🛁' },
  { value: 'shoes', label: 'Shoes', icon: '👟' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export const LANGUAGES = [
  'English',
  'Polish',
  'Ukrainian',
  'German',
  'French',
  'Spanish',
  'Italian',
  'Russian',
  'Chinese',
  'Arabic',
  'Portuguese',
  'Japanese',
  'Korean',
];
