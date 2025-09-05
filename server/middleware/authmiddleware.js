const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Obtener el header Authorization
  const authHeader = req.headers.authorization;

  // Verificar si no hay token o el formato es incorrecto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No hay token, autorización denegada' });
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Agregar los datos del usuario decodificados al request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role  // 👈 incluimos el rol del token
    };

    next(); // Continuar con la siguiente función
  } catch (err) {
    console.error('❌ Token inválido:', err.message);
    return res.status(401).json({ message: 'Token no válido' });
  }
};
