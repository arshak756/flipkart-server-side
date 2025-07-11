const express = require("express");
const Product = require("../models/product");
const authMiddleware = require("../middleware/authMiddleware");
const isAdmin = require("../middleware/isAdmin");
const mongoose = require("mongoose");


const router = express.Router();

// ✅ Get all products with optional filters: category, brand, search, type (subcategory)
router.get("/", async (req, res) => {
  try {
    const { category, brand, search, type } = req.query;
    let filter = {};

    if (category) filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    if (brand) filter.brand = { $regex: new RegExp(`^${brand}$`, "i") };
    if (type) filter.subcategory = { $regex: new RegExp(`^${type}$`, "i") };
    else if (search) {
      filter.$or = [
        { name: { $regex: new RegExp(search, "i") } },
        { subcategory: { $regex: new RegExp(search, "i") } },
        { description: { $regex: new RegExp(search, "i") } },
      ];
    }

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create a product (Admin only)
router.post("/", authMiddleware, isAdmin, async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ Update product by ID (Admin only)
router.put("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ Delete product by ID (Admin only)
router.delete("/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ Add Review (Fixed to return full updated product)
router.post("/:id/review", authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed)
      return res.status(400).json({ message: "You already reviewed this product" });

    const review = {
      _id: new mongoose.Types.ObjectId(),
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.unshift(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();

    // ✅ Return full updated product to avoid _id undefined error in frontend
    const updatedProduct = await Product.findById(req.params.id);
    res.status(201).json(updatedProduct);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ✅ Edit Review
router.patch("/:productId/review/:reviewId", authMiddleware, async (req, res) => {
  const { rating, comment } = req.body;

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized to edit this review" });

    if (rating !== undefined) review.rating = rating;
    if (comment) review.comment = comment;
    review.updatedAt = new Date();

    product.rating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(200).json({ message: "Review updated", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete Review
router.delete("/:productId/review/:reviewId", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized to delete this review" });

    review.remove();

    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.length === 0
        ? 0
        : product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(200).json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
