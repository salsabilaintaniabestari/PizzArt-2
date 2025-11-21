import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  email: string;
  username: string;
  points: number;
  achievements: Achievement[];
  createdAt: Date;
}

export interface Pizza {
  id: string;
  name: string;
  size: 'small' | 'medium' | 'large';
  crust: 'thin' | 'thick' | 'stuffed';
  sauce: string;
  toppings: Topping[];
  price: number;
  createdBy?: string;
  likes: number;
  isTemplate?: boolean;
}

export interface Topping {
  id: string;
  name: string;
  category: 'meat' | 'vegetable' | 'cheese' | 'sauce';
  price: number;
  image: string;
}

export interface CartItem {
  id: string;
  pizza: Pizza;
  quantity: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
}

export interface Contest {
  id: string;
  name: string;
  description: string;
  rules: string;
  prize: string;
  status: 'active' | 'upcoming' | 'finished';
  start_date: Timestamp;
  end_date: Timestamp;
  cover_image_url?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  winner_post_id?: string;
}

export interface CommunityPost {
  id: string;
  image_url: string;
  user_id: string;
  user_name: string;
  user_email: string;
  caption: string;
  toppings_used: string[];
  pizza_template_json: Pizza;
  likes_count: number;
  comments_count: number;
  created_at: Timestamp;
  is_for_contest: boolean;
  contest_name: string | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  comment_text: string;
  created_at: Timestamp;
}

export interface CommunityLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: Timestamp;
}