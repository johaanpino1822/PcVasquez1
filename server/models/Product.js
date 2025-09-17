const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    warranty: {
      type: Number,
      default: 12,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    specifications: {
      type: Object,
      default: {},
    },
    images: [{
      type: String,
    }],
    image: {
      type: String,
    },
    // Nuevo campo para soft delete
    deleted: {
      type: Boolean,
      default: false,
    },
    // Opcional: fecha de eliminación
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function(next) {
  if (this.image && (!this.images || this.images.length === 0)) {
    this.images = [this.image];
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);