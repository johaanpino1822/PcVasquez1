const mongoose = require('mongoose');

// =======================
// Subdocumentos
// =======================
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String }
});

const shippingInfoSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        const digits = v.replace(/\D/g, '');
        return digits.length >= 7;
      },
      message: props => `${props.value} no es un teléfono válido`
    }
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [ /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email inválido' ]
  },
  additionalInfo: { type: String, trim: true, maxlength: 255 }
});

const paymentDetailsSchema = new mongoose.Schema({
  transactionId: { type: String },
  status: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'COP' },
  method: { type: String },
  receiptUrl: { type: String },
  reference: { type: String },
  customerEmail: { type: String },
  customerName: { type: String },
  processedAt: { type: Date },
  wompiSignatureError: { type: Boolean, default: false }
});

// =======================
// Schema principal
// =======================
const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  shipping: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, required: true },
  shippingInfo: shippingInfoSchema,
  paymentDetails: paymentDetailsSchema,
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  wompiSignatureError: { type: Boolean, default: false },
  paymentReference: { type: String }
}, { timestamps: true });

// =======================
// Índices compuestos y únicos
// =======================
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'paymentDetails.transactionId': 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ paymentReference: 1 });

// =======================
// Métodos de instancia
// =======================
orderSchema.methods.isPaid = function() {
  return this.paymentStatus === 'completed';
};

orderSchema.methods.canBeCancelled = function() {
  return this.paymentStatus === 'pending' && this.status === 'pending';
};

// =======================
// Exportar modelo
// =======================
module.exports = mongoose.model('Order', orderSchema);
