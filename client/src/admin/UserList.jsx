import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FaSearch, FaTrash, FaEdit, FaAngleLeft, FaAngleRight, 
  FaAngleDoubleLeft, FaAngleDoubleRight, FaTimes, FaSave,
  FaUser, FaEnvelope, FaCalendar
} from 'react-icons/fa';
import { FaShieldAlt } from 'react-icons/fa';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const UserList = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Estados para edición y eliminación
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Paleta de colores profesional
  const colors = {
    primary: '#0C4B45',
    primaryLight: '#83F4E9',
    primaryDark: '#083D38',
    secondary: '#662D8F',
    secondaryLight: '#F2A9FD',
    accent: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    textDark: '#0C4B45',
    textLight: '#E0F3EB',
    background: '#F0F9F5'
  };

  // Obtener usuarios con paginación
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/admin/users?page=${currentPage}&limit=${usersPerPage}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const usersData = res.data?.data || [];
      const total = res.data?.total || 0;

      if (Array.isArray(usersData)) {
        setUsers(usersData);
        setFilteredUsers(usersData);
        setTotalUsers(total);
      } else {
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      setError('Error al cargar los usuarios');
      toast.error('Error al cargar los usuarios', {
        position: "top-right",
        className: 'bg-white border-l-4 border-red-500 shadow-lg'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, usersPerPage]);

  // Filtrar usuarios
  useEffect(() => {
    const result = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(result);
  }, [searchTerm, users]);

  // Iniciar edición de usuario
  const startEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditing(true);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingUser(null);
    setEditForm({ name: '', email: '', role: '' });
    setIsEditing(false);
  };

  // Guardar cambios del usuario
  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `http://localhost:5000/api/admin/users/${editingUser._id}/role`,
        { role: editForm.role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Actualizar lista localmente
      const updatedUsers = users.map(user =>
        user._id === editingUser._id 
          ? { ...user, name: editForm.name, email: editForm.email, role: editForm.role }
          : user
      );

      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      cancelEdit();

      toast.success(
        <div className="flex items-center">
          <FaSave className="text-[#0C4B45] mr-2" />
          <span>Usuario actualizado correctamente</span>
        </div>,
        {
          position: "top-right",
          className: 'bg-white border-l-4 border-[#4CAF50] shadow-lg'
        }
      );
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      toast.error('Error al actualizar usuario', {
        position: "top-right",
        className: 'bg-white border-l-4 border-red-500 shadow-lg'
      });
    }
  };

  // Confirmar eliminación
  const confirmDelete = (user) => {
    setDeleteConfirm(user);
  };

  // Cancelar eliminación
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Eliminar usuario confirmado
  const executeDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${deleteConfirm._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Actualizar lista después de eliminar
      const updatedUsers = users.filter(user => user._id !== deleteConfirm._id);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      setTotalUsers(prev => prev - 1);
      setDeleteConfirm(null);

      toast.success(
        <div className="flex items-center">
          <FaTrash className="text-[#0C4B45] mr-2" />
          <span>Usuario eliminado correctamente</span>
        </div>,
        {
          position: "top-right",
          className: 'bg-white border-l-4 border-[#662D8F] shadow-lg'
        }
      );

      // Si la página queda vacía y no es la primera, retroceder
      if (updatedUsers.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      toast.error('Error al eliminar usuario', {
        position: "top-right",
        className: 'bg-white border-l-4 border-red-500 shadow-lg'
      });
    }
  };

  // Lógica de paginación
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const maxVisiblePages = 5;

  const getPaginationRange = () => {
    const range = [];
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  };

  const paginationRange = getPaginationRange();

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Estados de carga
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0C4B45]/5 to-[#83F4E9]/5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-[#662D8F] border-t-transparent rounded-full"
        />
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-lg text-[#0C4B45] font-medium"
        >
          Cargando lista de usuarios...
        </motion.p>
      </div>
    );
  }

  // Manejo de errores
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0C4B45]/5 to-[#83F4E9]/5 p-6">
        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[#0C4B45] mb-2">Error al cargar usuarios</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 bg-gradient-to-r from-[#662D8F] to-[#F2A9FD] text-white rounded-xl font-medium hover:from-[#512577] hover:to-[#e895fc] transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Reintentar
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-[#83F4E9]/5 p-6">
      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold text-[#0C4B45] mb-4">Confirmar eliminación</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar al usuario <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email})? Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={cancelDelete}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="flex-1 py-2 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#0C4B45]">Gestión de Usuarios</h1>
              <p className="text-[#0C4B45]/80">Administra los usuarios registrados en el sistema</p>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-[#0C4B45]/60" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, email o rol..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0C4B45] uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaUser className="mr-2" /> Nombre
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0C4B45] uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaEnvelope className="mr-2" /> Email
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0C4B45] uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaShieldAlt  className="mr-2" /> Rol
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#0C4B45] uppercase tracking-wider">
                  <div className="flex items-center">
                    <FaCalendar className="mr-2" /> Fecha Registro
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[#0C4B45] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-r from-[#662D8F] to-[#F2A9FD] flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-[#F2A9FD] text-[#662D8F]' 
                          : 'bg-[#83F4E9] text-[#0C4B45]'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <motion.button
                          onClick={() => startEdit(user)}
                          className="text-[#0C4B45] hover:text-[#083D38] p-2 rounded-lg hover:bg-[#83F4E9]/20 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Editar usuario"
                        >
                          <FaEdit className="text-lg" />
                        </motion.button>
                        <motion.button
                          onClick={() => confirmDelete(user)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Eliminar usuario"
                        >
                          <FaTrash className="text-lg" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="text-gray-500 flex flex-col items-center">
                      <FaSearch className="text-4xl mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No se encontraron usuarios</p>
                      <p className="text-sm">Intenta con otros términos de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal de edición */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[#0C4B45]">Editar Usuario</h3>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="text-lg" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0C4B45] mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0C4B45] mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0C4B45] mb-2">
                      Rol
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#662D8F] focus:border-transparent"
                    >
                      <option value="user">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 py-2 px-4 bg-[#0C4B45] text-white rounded-xl hover:bg-[#083D38] transition-colors flex items-center justify-center"
                  >
                    <FaSave className="mr-2" />
                    Guardar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando {(currentPage - 1) * usersPerPage + 1} - {Math.min(currentPage * usersPerPage, totalUsers)} de {totalUsers} usuarios
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Botones de paginación... (mantener el código existente) */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList;