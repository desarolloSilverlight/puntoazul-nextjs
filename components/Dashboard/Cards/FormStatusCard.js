import React from "react";
import PropTypes from "prop-types";
import Link from "next/link";

export default function FormStatusCard({ title, states, totalUsers, type }) {
  const safeStates = states || {};

  const statusConfig = {
    sinIniciar: { color: "bg-gray-500", label: "Sin Iniciar" },
    sin_iniciar: { color: "bg-gray-500", label: "Sin Iniciar" },
    iniciados: { color: "bg-blue-500", label: "Iniciados" },
    finalizados: { color: "bg-cyan-600", label: "Finalizados" },
    guardados: { color: "bg-yellow-500", label: "Guardados" },
    pendientes: { color: "bg-orange-500", label: "Pendientes" },
    aprobados: { color: "bg-green-500", label: "Aprobados" },
    rechazados: { color: "bg-red-500", label: "Rechazados" }
  };

  // Mantener solo estados reportados por backend (no inferir "Sin Iniciar" en frontend)
  const allStates = Object.entries(safeStates).reduce((acc, [status, count]) => {
    acc[status] = Number(count) || 0;
    return acc;
  }, {});

  const totalEstados = Object.values(allStates).reduce((sum, count) => sum + count, 0);
  const denominator = totalEstados > 0 ? totalEstados : (Number(totalUsers) || 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <div className="text-sm text-gray-500">
          {totalUsers} usuarios totales
        </div>
      </div>

      {/* Barra de progreso visual */}
      <div className="mb-6">
        <div className="flex rounded-full overflow-hidden h-4 bg-gray-200">
          {Object.entries(allStates).map(([status, count]) => {
            const config = statusConfig[status];
            if (!config || count === 0) return null;
            const percentage = denominator > 0 ? (count / denominator) * 100 : 0;
            
            return (
              <div
                key={status}
                className={`${config.color} transition-all duration-500`}
                style={{ width: `${percentage}%` }}
                title={`${config.label}: ${count} (${percentage.toFixed(1)}%)`}
              ></div>
            );
          })}
        </div>
      </div>

      {/* Grid de estados */}
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(allStates).map(([status, count]) => {
          const config = statusConfig[status];
          if (!config) return null;
          const percentage = denominator > 0 ? ((count / denominator) * 100).toFixed(1) : '0.0';
          
          return (
            <div key={status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${config.color}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {config.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Acciones rápidas específicas */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          {/* <Link href={type === 'lineaBase' ? '/admin/validarf' : '/admin/validarb'} className="flex-1">
            <button className="w-full bg-lightBlue-600 text-white text-sm py-2 px-3 rounded hover:bg-lightBlue-700 transition-colors duration-200">
              <i className="fas fa-eye mr-2"></i>
              Ver Detalle
            </button>
          </Link> */}
          {(states.pendientes > 0) && (
            <Link href={type === 'lineaBase' ? '/admin/validarf' : '/admin/validarb'} className="flex-1">
              <button className="w-full bg-orange-600 text-white text-sm py-2 px-3 rounded hover:bg-orange-700 transition-colors duration-200">
                <i className="fas fa-clipboard-check mr-2"></i>
                Validar ({states.pendientes})
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

FormStatusCard.propTypes = {
  title: PropTypes.string.isRequired,
  states: PropTypes.shape({
    sinIniciar: PropTypes.number,
    sin_iniciar: PropTypes.number,
    iniciados: PropTypes.number,
    finalizados: PropTypes.number,
    guardados: PropTypes.number,
    pendientes: PropTypes.number,
    aprobados: PropTypes.number,
    rechazados: PropTypes.number
  }).isRequired,
  totalUsers: PropTypes.number.isRequired,
  type: PropTypes.string.isRequired
};
