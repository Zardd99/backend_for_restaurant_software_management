import express from "express";
import orderRoute from "./api/orders/route";
import menuRoute from "./api/menu/route";
import reviews from "./api/reviews/route";
import connectDB from "./config/db";
import dotenv from "dotenv";
import rateLimiter from "./middleware/rateLimter";
dotenv.config();

const app = express();
const port = process.env.PORT;

connectDB();

// middleware:
// a function run middle of a req and res
// this code just before the res is sent this will Converts JSON data from the request body into a JavaScript object
// accessible via req.body
app.use(express.json());
app.use(rateLimiter());

app.use("/api/orders", orderRoute);
app.use("/api/menu", menuRoute);
app.use("/api/reviews", reviews);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
