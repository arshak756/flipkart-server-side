const express = require("express");
const Order = require("../models/order");
const Product = require("../models/product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ✅ Create a new order
router.post("/", authMiddleware, async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: "No order items" });
  }

  try {
    // ✅ Inject product image from DB into orderItems
    const enrichedItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) throw new Error(`Product not found: ${item.product}`);

        return {
          name: item.name,
          qty: item.qty,
          price: item.price,
          product: item.product,
          image: product.image,
        };
      })
    );

    const order = new Order({
      user: req.user.id,
      orderItems: enrichedItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      isPaid: paymentMethod === "Card Payment", // ✅ Auto-mark as paid for card
      paidAt: paymentMethod === "Card Payment" ? Date.now() : null,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (err) {
    console.error("Order creation failed:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get logged-in user's orders
router.get("/myorders", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).populate("orderItems.product");
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Cancel an order
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (String(order.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (order.isDelivered) {
      return res.status(400).json({ message: "Cannot cancel delivered order" });
    }

    // ✅ Use findByIdAndDelete for better compatibility
    await Order.findByIdAndDelete(req.params.id);

    res.json({ message: "✅ Order cancelled successfully" });
  } catch (err) {
    console.error("Cancel Order Failed:", err.message);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Mark order as paid after Stripe payment (if needed separately)
router.patch("/:id/pay", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (String(order.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    order.isPaid = true;
    order.paidAt = Date.now();

    const updatedOrder = await order.save();
    res.json({ message: "Order marked as paid", updatedOrder });
  } catch (err) {
    console.error("Mark as paid failed:", err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
