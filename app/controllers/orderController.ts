import { Request, Response } from "express";
import Order, { IOrder } from "../models/Order";

interface FilterConditions {
  status?: string;
  customer?: string;
  orderType?: string;
  orderDate?: {
    $gte?: Date;
    $lte?: Date;
  };
  totalAmount?: {
    $gte?: number;
    $lte?: number;
  };
}

// getAllOrders API endpoint
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      status,
      customer,
      orderType,
      startDate,
      endDate,
      minAmount,
      maxAmount,
    } = req.query;
    const filter: FilterConditions = {};

    if (status) filter.status = status as string;
    if (customer) filter.customer = customer as string;
    if (orderType) filter.orderType = orderType as string;

    // filter by date
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate as string);
      if (endDate) filter.orderDate.$lte = new Date(endDate as string);
    }

    // filter by price
    if (minAmount || maxAmount) {
      filter.totalAmount = {};
      if (minAmount) filter.totalAmount.$gte = Number(minAmount);
      if (maxAmount) filter.totalAmount.$lte = Number(maxAmount);
    }

    const orders = await Order.find(filter)
      .populate("customer", "name email")
      .populate("items.menuItem", "name price")
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// getOrderById API endpoint
export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer", "name email phone")
      .populate("items.menuItem", "name price description");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// createOrder API endpoint
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order: IOrder = new Order(req.body);
    const savedOrder = await order.save();

    await savedOrder.populate([
      { path: "customer", select: "name email" },
      { path: "items.menuItem", select: "name price" },
    ]);

    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: "Error creating order", error });
  }
};

// updateOrder API endpoint
export const updateOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("customer", "name email")
      .populate("items.menuItem", "name price");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Error updating order", error });
  }
};

// deleteOrder API endpoint
export const deleteOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// updateOrderStatus API endpoint
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid status value" });
      return;
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate("customer", "name email")
      .populate("items.menuItem", "name price");

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: "Error updating order status", error });
  }
};
