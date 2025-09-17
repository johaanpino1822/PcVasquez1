import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from "react-toastify";
import ProductForm from './ProductForm';

const ProductEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleProductSubmit = (updatedProduct) => {
    console.log('Producto actualizado:', updatedProduct);
    // Mostrar mensaje de éxito
    toast.success('Producto actualizado exitosamente', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: true,
      className: "border-l-4 border-green-500 bg-white shadow-lg"
    });
    
    // Redirigir después de un breve delay
    setTimeout(() => {
      navigate('/admin/products');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C4B45]/5 to-white p-6">
      <ProductForm 
        mode="edit" 
        productId={id}
        onSubmit={handleProductSubmit} 
        onCancel={() => navigate('/admin/products')}
      />
    </div>
  );
};

export default ProductEdit;