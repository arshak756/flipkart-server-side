// Load env first
const dotenv = require("dotenv");
dotenv.config();
console.log("Stripe Key Loaded:", process.env.STRIPE_SECRET_KEY ? "✅ Yes" : "❌ No");

const express = require("express");
const cors = require("cors"); // ✅ CORS added here
const mongoose = require("mongoose");

// Import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Initialize app
const app = express();
app.use(cors()); // ✅ Allow frontend requests from port 5173
app.use(express.json()); // Middleware to parse JSON

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
