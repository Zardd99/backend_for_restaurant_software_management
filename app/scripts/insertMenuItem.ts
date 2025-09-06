import mongoose from "mongoose";
import dotenv from "dotenv";
import MenuItem from "../models/MenuItem";
import connectDB from "../config/db";

// Load environment variables
dotenv.config();

// Document to insert
const menuItemData = {
  name: "Margherita Pizza",
  description: "Classic pizza with tomato sauce, mozzarella, and fresh basil.",
  price: 12.99,
  category: new mongoose.Types.ObjectId("64f8c2e2b8d1e5a1c2b3a4f7"), // Ensure it's an ObjectId
  imageUrl: "images/margherita.jpg",
  ingredients: ["Tomato Sauce", "Mozzarella", "Basil", "Olive Oil"],
  dietaryTags: ["vegetarian"],
  isAvailable: true,
  preparationTime: 20,
  chefSpecial: true,
  averageRating: 4.7,
  reviewCount: 120,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Define proper TypeScript interfaces for error handling
interface MongoError extends Error {
  code?: number;
  errmsg?: string;
}

interface ValidationError extends Error {
  errors?: {
    [path: string]: mongoose.Error.ValidatorError | mongoose.Error.CastError;
  };
}

function isMongoError(error: unknown): error is MongoError {
  return error instanceof Error && "code" in error;
}

function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && "errors" in error;
}

async function insertMenuItem() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to database successfully!");

    // Create a new menu item
    const menuItem = new MenuItem(menuItemData);

    // Save to database
    const savedItem = await menuItem.save();

    console.log("Menu item inserted successfully!");
    console.log("Inserted ID:", savedItem._id);
    console.log("Inserted Item:", savedItem);
  } catch (error) {
    console.error("Error inserting document:", error);

    // Handle specific MongoDB errors with proper typing
    if (isMongoError(error) && error.code === 11000) {
      console.error("Duplicate key error - item might already exist");
    }

    if (isValidationError(error) && error.errors) {
      console.error("Validation errors:");
      Object.keys(error.errors).forEach((key) => {
        console.error(`- ${key}: ${error.errors![key].message}`);
      });
    }
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
}

// Run the function
insertMenuItem();
