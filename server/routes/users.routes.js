const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authmiddleware');

// 🟢 Ruta de registro de nuevo usuario
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('📝 Intento de registro:', { name, email });

    // Validación de campos requeridos
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Nombre, email y contraseña son obligatorios' 
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('❌ Usuario ya registrado:', email);
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Crear el nuevo usuario
    const newUser = new User({
      name,
      email,
      password,
      role: role || 'user' // Valor por defecto si no se especifica
    });

    // Guardar el usuario (el pre-save hook hasheará la contraseña)
    await newUser.save();
    console.log('✅ Usuario registrado:', newUser.email);

    // Generar token JWT
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no definido');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Respuesta exitosa
    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      },
      message: 'Registro exitoso'
    });

  } catch (err) {
    console.error('🔥 Error en registro:', err.message);
    res.status(500).json({ 
      message: 'Error al registrar el usuario',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🟢 Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 Intento de login:', { email });

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    if (!user.password) {
      console.error('⚠️ El usuario no tiene contraseña en la base de datos');
      return res.status(500).json({ message: 'Error en la cuenta de usuario' });
    }

    const isMatch = await user.comparePassword(password);
    console.log('🔍 Contraseña válida:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no definido');
      return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Login exitoso para:', user.email);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Inicio de sesión exitoso'
    });
  } catch (err) {
    console.error('🔥 Error en login:', err.message);
    res.status(500).json({ 
      message: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🟢 Ruta protegida: obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error('🔥 Error al obtener perfil:', err.message);
    res.status(500).json({ 
      message: 'Error al obtener el perfil',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🟡 Ruta temporal para restablecer contraseña (SOLO PARA USO INTERNO O PRUEBAS)
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ message: 'Email y nueva contraseña son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const user = await User.findOneAndUpdate(
      { email: email.trim() },
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    console.log(`🔁 Contraseña restablecida para: ${email}`);
    res.json({ 
      message: 'Contraseña actualizada correctamente', 
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('🔥 Error al restablecer contraseña:', err.message);
    res.status(500).json({ 
      message: 'Error al actualizar la contraseña',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;