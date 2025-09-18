require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const retry = require('async-retry');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const app = express();

// === CONFIGURACIÓN CRÍTICA: Trust proxy ===
app.set('trust proxy', 1);

// === Seguridad con Helmet ===
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" } // ✅ Permite recursos cross-origin
  })
);

// === Compresión ===
app.use(compression());

// === Conexión a MongoDB con reintento ===
const connectToMongoDB = async () => {
  try {
    await retry(
      async () => {
        await mongoose.connect(process.env.MONGODB_URI, {
          serverSelectionTimeoutMS: 30000,
          socketTimeoutMS: 45000,
        });
        console.log('✅ Conectado a MongoDB');
      },
      {
        retries: 5,
        factor: 2,
        minTimeout: 1000,
        maxTimeout: 10000,
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

// === CORS MEJORADO ===
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:5000',
      'https://checkout.wompi.co' // ✅ Permitir Wompi
    ];
    
    // Permitir requests sin origin (como curl, postman, o recursos estáticos)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Origen no permitido por CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-auth-token',
    'x-event-checksum',
    'x-event-type',
    'x-event-id',
    'Accept',
    'Origin',
    'X-Requested-With'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Date',
    'ETag'
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400 // 24 horas
};
app.use(cors(corsOptions));

// === Rate Limiting (excluye webhooks y estáticos) ===
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) =>
    req.originalUrl.startsWith('/api/webhook') ||
    req.originalUrl.startsWith('/api/orders/wompi-webhook') ||
    req.originalUrl.startsWith('/uploads/') || // ✅ Permite todas las rutas de uploads
    req.originalUrl.includes('.jpg') || // ✅ Permite archivos JPG
    req.originalUrl.includes('.jpeg') || // ✅ Permite archivos JPEG
    req.originalUrl.includes('.png') || // ✅ Permite archivos PNG
    req.originalUrl.includes('.webp') || // ✅ Permite archivos WEBP
    req.originalUrl.includes('.gif'), // ✅ Permite archivos GIF
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use(limiter);

// ✅ Middleware ESPECIAL para Webhook de Wompi (raw body)
app.use((req, res, next) => {
  if (req.method === 'POST' && req.originalUrl.startsWith('/api/orders/wompi-webhook')) {
    let data = [];
    req.on('data', (chunk) => data.push(chunk));
    req.on('end', () => {
      req.rawBody = Buffer.concat(data);
      console.log('📩 Raw body recibido - length:', req.rawBody.length);
      next();
    });
    req.on('error', (err) => {
      console.error('❌ Error leyendo raw body:', err);
      res.status(500).json({ success: false, error: 'Error leyendo raw body' });
    });
  } else {
    next();
  }
});

// ✅ Servir archivos estáticos desde /uploads/products con headers CORS adecuados
app.use(
  '/uploads/products',
  express.static(path.join(__dirname, 'uploads', 'products'), {
    setHeaders: (res, path) => {
      // Configurar headers CORS para archivos estáticos
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Headers de cache para imágenes
      if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || 
          path.endsWith('.webp') || path.endsWith('.gif')) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache de 24 horas
      }
    }
  })
);

// ✅ Servir también el placeholder desde la raíz de uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path) => {
      res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  })
);

// === Middlewares generales (JSON / URLENCODED) ===
app.use(express.json({ limit: '10mb' }));
app.use(
  express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 10000 })
);

// === Cargar rutas dinámicas ===
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

if (productRoutes) app.use('/api/products', productRoutes);
if (orderRoutes) app.use('/api/orders', orderRoutes);
if (userRoutes) app.use('/api/users', userRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

// === Ruta de salud ===
app.get('/health', async (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: 'healthy',
    database: dbStatus,
    uptime: process.uptime(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

// === Ruta para servir placeholder image ===
app.get('/placeholder-product.jpg', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'placeholder-product.jpg'));
});

// === Ruta de prueba para webhook ===
app.get('/api/test-webhook', (req, res) => {
  res.json({
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
  });
});

// === Ruta para probar imágenes ===
app.get('/api/test-image/:imageName', (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, 'uploads', 'products', imageName);
  
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error('Error serving image:', err);
      res.status(404).json({ error: 'Image not found' });
    }
  });
});

// === Manejo global de errores ===
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  const errorResponse = {
    success: false,
    message: err.message || 'Error interno del servidor',
  };

  switch (err.name) {
    case 'ValidationError':
      res.status(400);
      errorResponse.errors = Object.keys(err.errors).map((key) => ({
        field: key,
        message: err.errors[key].message,
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

// === Ruta para manejar 404 ===
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
  });
});

// === Iniciar servidor ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`
  );
  console.log(
    `🔗 Webhook Wompi: http://localhost:${PORT}/api/orders/wompi-webhook`
  );
  console.log(
    `📁 Serviendo archivos estáticos desde: ${path.join(__dirname, 'uploads', 'products')}`
  );
});

module.exports = app;