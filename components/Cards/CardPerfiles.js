import React from "react";
import PropTypes from "prop-types";
import Button from "/components/Button";

const perfiles = [
  { id: 1, nombre: "Administrador", cantidad: 5 },
  { id: 2, nombre: "Asociado", cantidad: 8 },
  { id: 3, nombre: "Coordinador", cantidad: 3 },
  { id: 4, nombre: "Invitado", cantidad: 10 },
];
export default function CardTable({ color, data, onEdit }) {
  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full px-4 max-w-full flex-grow flex-1">
            <h3
              className={
                "font-semibold text-lg " +
                (color === "light" ? "text-blueGray-700" : "text-white")
              }
            >
              Tabla de Perfiles
            </h3>
            
          </div>
          <button
              className="bg-lightBlue-600 active:bg-lightBlue-400 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
              type="button"
            >
              Nuevo Perfil
            </button>
        </div>
      </div>
      <div className="block w-full overflow-x-auto">
        <table className="items-center w-full bg-transparent border-collapse">
          <thead>
            <tr>
              <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                Nombre
              </th>
              <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                Cantidad
              </th>
              <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {perfiles.map((perfil) => (
              <tr key={perfil.id} className="border-t">
                <td className="p-2">{perfil.nombre}</td>
                <td className="p-2">{perfil.cantidad}</td>
                <td className="p-2">
                  <button
                    className="bg-blueGray-700 active:bg-blueGray-600 text-white font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
                    type="button"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

CardTable.propTypes = {
  color: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      nombre: PropTypes.string.isRequired,
      cantidad: PropTypes.number.isRequired,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
};
