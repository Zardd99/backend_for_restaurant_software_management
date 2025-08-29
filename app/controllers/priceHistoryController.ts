import { Request, Response } from "express";
import PriceHistory from "../models/PriceHistory";
import { Types } from "mongoose";

interface FilterConditions {
  menuItem?: Types.ObjectId;
  oldPrice?: number;
  newPrice?: number;
  changeBy?: Types.ObjectId;
  changeDate?:
    | {
        $gte?: Date;
        $lte?: Date;
      }
    | Date;
}

/**
 * GET api/priceHistory
 * Retrieve all price's history with optional filtering by menuItem, old price, new price, change by and change date
 *
 * @param req - Express Request object with query
 * @param res - Express Response object
 *
 * Query Parameters:
 *  - menuItem: filter by menuItem id
 *  - oldPrice: filter by old price
 *  - newPrice: filter by new price
 *  - changeBy: filter by change by (userId)
 *
 *  @returns JSON response with array of menu items or error message
 */

export const getAllPriceHistorys = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      menuItem,
      oldPrice,
      newPrice,
      changeBy,
      changeDate,
      dateFrom,
      dateTo,
    } = req.query;

    const filter: FilterConditions = {};

    if (menuItem && Types.ObjectId.isValid(menuItem as string)) {
      filter.menuItem = new Types.ObjectId(menuItem as string);
    }

    if (changeBy && Types.ObjectId.isValid(changeBy as string)) {
      filter.changeBy = new Types.ObjectId(changeBy as string);
    }

    if (oldPrice) filter.oldPrice = Number(oldPrice);

    if (newPrice) filter.newPrice = Number(newPrice);

    if (changeDate) {
      filter.changeDate = {};
      if (dateFrom) {
        filter.changeDate.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        filter.changeDate.$lte = new Date(dateTo as string);
      }
    } else if (changeDate) {
      const queryDate = new Date(changeDate as string);
      const startDay = new Date(queryDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(queryDate.setHours(24, 59, 59, 999));
      filter.changeDate = { $gte: startDay, $lte: endOfDay };
    }

    const priceHistory = await PriceHistory.find(filter).populate(
      "menuItem",
      "name price category"
    );

    res.json({
      success: true,
      data: priceHistory,
      count: priceHistory.length,
    });
  } catch (error) {
    console.error("Server Error", error);
    res.status(500).json({
      success: false,
      message: "server error",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};

export const getAllPriceHistorysById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({
        success: false,
        message: "Invalid Price History Format",
      });
      return;
    }

    const priceHistory = await PriceHistory.findById(req.params.id).populate(
      "menuItem",
      "name price category description"
    );

    if (!priceHistory) {
      res.status(404).json({
        success: false,
        message: "Price History not found",
      });
      return;
    }

    res.json({
      success: true,
      data: priceHistory,
    });
  } catch (error) {
    console.error("Error in getPriceHistoryById:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? error : {},
    });
  }
};
