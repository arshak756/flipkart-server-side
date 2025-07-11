// Load env first
const dotenv = require("dotenv");
dotenv.config();
console.log("Stripe Key Loaded:", process.env.STRIPE_SECRET_KEY ? "✅ Yes" : "❌ No");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// ✅ Fixed CORS setup
app.use(cors({
  origin: "http://localhost:5173", // your React frontend running locally
  credentials: true
}));

app.use(express.json());

// Route middleware
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payments", paymentRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// Default test route
app.get("/", (req, res) => {
  res.send("NeoMart API is working!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
