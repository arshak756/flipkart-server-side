const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, default: "Anonymous" },
    rating: { type: Number, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    // ✅ Image stored in MongoDB as Buffer with content type
    image: {
      data: Buffer,
      contentType: String,
    },

    description: { type: String, required: true },
    category: { type: String, required: true },
    subcategory: { type: String },
    brand: { type: String },
    price: { type: Number, required: true },
    countInStock: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
