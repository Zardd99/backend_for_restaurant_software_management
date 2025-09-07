import mongoose from "mongoose";

export interface MongoError extends Error {
  code?: number;
  errmsg?: string;
  keyValue?: Record<string, any>;
}

export interface ValidationError extends Error {
  errors?: {
    [path: string]: mongoose.Error.ValidatorError | mongoose.Error.CastError;
  };
}

export interface MenuItemData {
  name: string;
  description: string;
  price: number;
  category: mongoose.Types.ObjectId;
  imageUrl: string;
  ingredients: string[];
  dietaryTags: string[];
  isAvailable: boolean;
  preparationTime: number;
  chefSpecial?: boolean;
  averageRating?: number;
  reviewCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

export interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: Error;
}
