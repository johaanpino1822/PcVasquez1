require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const retry = require('async-retry');
const path = require('path');

const app = express();

// === Conexión a MongoDB con reintento ===
const connectToMongoDB = async () => {
  try {
    await retry(
      async () => {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
          family: 4,
          retryWrites: true,
          w: 'majority'
        });
        console.log('✅ Conectado a MongoDB');
      },
      {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000
      }
    );
  } catch (error) {
    console.error('❌ Error crítico de conexión a MongoDB:', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB desconectado. Intentando reconectar...');
  connectToMongoDB();
});

connectToMongoDB();

// === CORS ===
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// === Middlewares ===
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  parameterLimit: 10000
}));

// ✅ Servir archivos estáticos desde /uploads/products
app.use('/uploads/products', express.static(path.join(__dirname, 'uploads', 'products')));

// === Cargar rutas dinámicas de forma segura ===
const loadRoute = (routePath) => {
  try {
    return require(routePath);
  } catch (err) {
    console.error(`⚠️  No se pudo cargar la ruta: ${routePath}, ${err.message}`);
    return null;
  }
};

const productRoutes = loadRoute('./routes/products.routes');
const orderRoutes = loadRoute('./routes/orders.routes');
const userRoutes = loadRoute('./routes/users.routes');
const adminRoutes = loadRoute('./routes/admin.routes');
const wompiRoutes = loadRoute('./routes/wompi.routes');

if (productRoutes) app.use('/api/products', productRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (wompiRoutes) app.use('/api/wompi', wompiRoutes);

// === Ruta de salud ===
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
    }
  });
});

// === Manejo global de errores ===
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  const errorResponse = {
    success: false,
    message: err.message || 'Error interno del servidor'
  };

  switch (err.name) {
    case 'ValidationError':
      res.status(400);
      errorResponse.errors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      break;
    case 'UnauthorizedError':
      res.status(401);
      errorResponse.message = 'No autorizado';
      break;
    case 'MongoServerError':
      res.status(400);
      if (err.code === 11000) {
        errorResponse.message = 'Registro duplicado';
        errorResponse.duplicateField = Object.keys(err.keyPattern)[0];
      }
      break;
    default:
      res.status(err.status || 500);
      if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
      }
  }

  res.json(errorResponse);
});

module.exports = app;