import express from "express";
import orderRoute from "./api/orders/route";
import menuRoute from "./api/menu/route";
import reviews from "./api/reviews/route";
import rating from "./api/reviews/rating/route";
import category from "./api/category/route";
import priceHistory from "./api/priceHistory/route";
import supplierRoute from "./api/supplier/route";
import receiptRoutes from "./api/receipts/route";
import userRoutes from "./api/users/route";
import authRoutes from "./api/auth/route";

import connectDB from "./config/db";
import dotenv from "dotenv";
import rateLimiter from "./middleware/rateLimter";
import cors from "cors";
dotenv.config();

const app = express();
const port = process.env.PORT;

connectDB();

const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// middleware:
// a function run middle of a req and res
// this code just before the res is sent this will Converts JSON data from the request body into a JavaScript object
// accessible via req.body

app.use(cors(corsOptions));
app.options("", cors(corsOptions));
app.use(express.json());
// app.use(rateLimiter());
app.use(express.urlencoded({ extended: true }));

app.use("/api/orders", orderRoute);
app.use("/api/menu", menuRoute);
app.use("/api/reviews", reviews);
app.use("/api/review/rating", rating);
app.use("/api/category", category);
app.use("/api/priceHistory", priceHistory);

app.use("/api/supplier", supplierRoute);

app.use("/api/receipts", receiptRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
