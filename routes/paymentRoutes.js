// routes/paymentRoutes.js
const express = require("express");
const Stripe = require("stripe");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Create Stripe Payment Intent
router.post("/create-payment-intent", authMiddleware, async (req, res) => {
  const { totalPrice } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), 
      currency: "inr", 
      payment_method_types: ["card"],
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).json({ message: "Failed to create payment intent" });
  }
});

module.exports = router;
