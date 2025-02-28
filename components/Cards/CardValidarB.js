import React from "react";
import PropTypes from "prop-types";
import Button from "/components/Button";
import { useRouter } from "next/router";
const asociados = [
    {
      id: 1,
      nombre: "Juan Pérez",
      nit: "900123456-7",
      celular: "3101234567",
      email: "juan.perez@example.com",
    },
    {
      id: 2,
      nombre: "María Gómez",
      nit: "901234567-8",
      celular: "3207654321",
      email: "maria.gomez@example.com",
    },
    {
      id: 3,
      nombre: "Carlos Ramírez",
      nit: "902345678-9",
      celular: "3159876543",
      email: "carlos.ramirez@example.com",
    },
    {
      id: 4,
      nombre: "Laura Fernández",
      nit: "903456789-0",
      celular: "3123456789",
      email: "laura.fernandez@example.com",
    },
  ];
  
export default function CardTable({ color, data, onEdit }) {
  const router = useRouter();
  const handleValidar = (asociado) => {
    router.push({
      pathname: "/Forms/formValidarB",
      query: {
        nombre: asociado.nombre,
        nit: asociado.nit,
      },
    });
  };
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
              Seleccione un asociado
            </h3>            
          </div>
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
                NIT
              </th>
              <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                Celular
              </th>
              <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                Email
              </th>
              <th className="px-6 py-3 text-xs uppercase border-l-0 border-r-0 font-semibold text-left bg-blueGray-50 text-blueGray-500 border-blueGray-100">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {asociados.map((asociado) => (
              <tr key={asociado.id} className="border-t">
                <td className="p-2">{asociado.nombre}</td>
                <td className="p-2">{asociado.nit}</td>
                <td className="p-2">{asociado.celular}</td>
                <td className="p-2">{asociado.email}</td>
                <td className="p-2">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    onClick={() => handleValidar(asociado)}
                  >
                    Validar
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
