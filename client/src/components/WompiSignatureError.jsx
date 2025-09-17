import React from 'react';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const WompiSignatureError = ({ error, onRetry }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0 text-red-500" />
        <div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Error de Firma Wompi</h2>
          <p className="text-red-700 mb-3">
            Se ha detectado un error en la verificación de la firma del webhook de Wompi.
          </p>
          
          {error && (
            <div className="mb-4">
              <h3 className="font-semibold text-red-800 mb-1">Detalles del error:</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h3 className="font-semibold text-red-800 mb-1">Posibles causas:</h3>
            <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
              <li>La clave secreta de Wompi no coincide con la configurada</li>
              <li>El payload del webhook ha sido alterado</li>
              <li>Problemas de encoding en los datos</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold text-red-800 mb-1">Solución:</h3>
            <p className="text-red-700 text-sm">
              Verifica la configuración de Wompi en el dashboard y asegúrate de que la clave secreta sea correcta.
            </p>
          </div>
          
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
            >
              Reintentar verificación
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WompiSignatureError;