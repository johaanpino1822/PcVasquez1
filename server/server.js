const app = require('./app'); // 👈 importar la instancia de Express
const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
