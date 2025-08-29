import { Request, Response } from "express";
import Category, { ICategory } from "../models/Category";

interface FilterConditions {
  name?: string;
  isActive?: boolean;
}

const getAllCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, isActive } = req.query;
    const filter: FilterConditions = {};

    if (name) filter.name = name as string;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const category = await await Category.find(filter).populate(
      "category",
      "name"
    );

    res.json(category);
  } catch (error) {
    res.status(500).json({
        success: false,
        message: "Server Error", error
    })
  }
};


