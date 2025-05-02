import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function CardTable({ color }) {
  const [usuarios, setUsuarios] = useState([]); // Estado para los usuarios
  const [productos, setProductos] = useState([]); // Estado para los productos
  const [showForm, setShowForm] = useState(false); // Mostrar tabla de validación
  const [selectedAsociado, setSelectedAsociado] = useState(null); // Usuario seleccionado
  const [isOpen, setIsOpen] = useState(false); // Estado para el modal

  // Función para obtener usuarios desde el backend
  const fetchUsuarios = async () => {
    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-b/getValidarB", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Usuarios obtenidos:", data); // Ver usuarios en consola
      setUsuarios(data); // Guardar usuarios en el estado
    } catch (error) {
      console.error("Error al obtener los usuarios:", error);
    }
  };

  // Llamar a fetchUsuarios al cargar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Manejar la validación de un usuario
  const handleValidar = async (idInformacionB) => {
    console.log("ID de usuario seleccionado:", idInformacionB); // Ver ID en consola
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-b/getProdValidarB/${idInformacionB}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Productos obtenidos:", data); // Ver productos en consola
      setProductos(data); // Guardar productos en el estado
      setShowForm(true); // Mostrar la tabla de validación
    } catch (error) {
      console.error("Error al obtener los productos:", error);
    }
  };

  return (
    <div
      className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${
        color === "light" ? "bg-white" : "bg-blueGray-700 text-white"
      }`}
    >
      {!showForm ? (
        <>
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <h3 className="text-lg font-semibold flex items-center">
              Seleccione un vinculado&nbsp;
              <i
                className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
                onClick={() => setIsOpen(true)}
              ></i>
            </h3>
          </div>
          <div className="block w-full overflow-x-auto">
            <table className="items-center w-full bg-transparent border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Nombre</th>
                  <th className="p-2">NIT</th>
                  <th className="p-2">Telefono</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.idInformacionB} className="border-t text-center">
                    <td className="p-2">{usuario.nombre}</td>
                    <td className="p-2">{usuario.nit}</td>
                    <td className="p-2">{usuario.telefono}</td>
                    <td className="p-2">{usuario.correoFacturacion}</td>
                    <td className="p-2">
                      <button
                        className="bg-lightBlue-600 text-white font-bold text-xs px-4 py-2 rounded shadow hover:shadow-md"
                        onClick={() => handleValidar(usuario.idInformacionB)}
                      >
                        Validar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Modal */}
          {isOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
              <div className="bg-white p-5 rounded-lg shadow-lg max-h-260-px overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
                {/* Tabla */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-200">
                        <th className="border border-gray-300 px-4 py-2">#</th>
                        <th className="border border-gray-300 px-4 py-2">Campo</th>
                        <th className="border border-gray-300 px-4 py-2">Tipo</th>
                        <th className="border border-gray-300 px-4 py-2">Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["1", "Nombre o Razón Social", "Texto", "Razón social o nombre de la persona natural o jurídica participante."],
                        ["2", "NIT", "Número", "Número de Identificación Tributaria."],
                        ["3", "Dirección", "Texto", "Dirección de recepción de notificaciones."],
                        ["4", "Ciudad", "Texto", "Ciudad correspondiente a la Dirección de Notificación."],
                        ["5", "Casa matriz", "Texto", "Nacional de la empresa inscrita al Plan."],
                        ["6", "Correo de Facturación", "Texto", "Correo electrónico de la persona que recibe facturas."],
                      ].map((row, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-4 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  className="bg-blueGray-600 text-white px-4 py-2 rounded mt-3"
                  onClick={() => setIsOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <FormValidarB productos={productos} goBack={() => setShowForm(false)} fetchUsuarios={fetchUsuarios} />
      )}
    </div>
  );
}

function FormValidarB({ productos, goBack, fetchUsuarios }) {
  // Función para manejar la acción de firmar
  const handleFirmar = async () => {
    const idInformacionB = productos[0].idInformacionB.idInformacionB; // Obtener el ID
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-b/updateEstado/${idInformacionB}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Aprobado" }), // Enviar el nuevo estado
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Estado actualizado a Aprobado:", result);
      alert("El estado se ha actualizado a Aprobado.");
      goBack(); // Volver a la tabla principal
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Hubo un error al actualizar el estado.");
    }
    fetchUsuarios(); // Volver a cargar los usuarios
    goBack(); // Volver a la tabla principal
  };

  // Función para manejar la acción de rechazar
  const handleRechazar = async () => {
    const idInformacionB = productos[0].idInformacionB.idInformacionB; // Obtener el ID
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-b/updateEstado/${idInformacionB}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Rechazado" }), // Enviar el nuevo estado
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Estado actualizado a Rechazado:", result);
      alert("El estado se ha actualizado a Rechazado.");
      goBack(); // Volver a la tabla principal
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      alert("Hubo un error al actualizar el estado.");
    }
    fetchUsuarios(); // Volver a cargar los usuarios
    goBack(); // Volver a la tabla principal
  };
  return (
    <div className="p-4 bg-white shadow-lg rounded">
      <h3 className="text-lg font-semibold">Validacion {productos[0].idInformacionB.nombre}</h3>
      <div className="w-full overflow-x-auto p-4">
        <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Item</th>
              <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Razón Social</th>
              <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">NIT</th>
              <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Origen de capital MUNTINACIONAL / NACIONAL</th>
              <th colSpan={10} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Distribución y comercialización AÑO {new Date().getFullYear() - 1}</th>
              <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
              <th rowSpan={4} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">TOTAL DE PESO DEL PRODUCTO ({new Date().getFullYear() - 1})</th>
              <th colSpan={3} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Comparativo Peso Facturación</th>
              <th colSpan={3} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Grupo</th>
              <th colSpan={1} rowSpan={4} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Conformidad según literal</th>
              <th colSpan={1} rowSpan={4} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Tendencia de comportamiento</th>
            </tr>
            <tr className="bg-gray-200">
              <th colSpan={4} rowSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Comercial</th>
              <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Institucional</th>
              <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Intrahospitalario</th>
              <th colSpan={2} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Muestras médicas</th>
            </tr>
            <tr className="bg-gray-200">
              <th colSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">RX</th>
              <th colSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">OTC</th>
              <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Peso Facturación {new Date().getFullYear() - 1} (KG)</th>
              <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Peso Facturación {new Date().getFullYear() - 2} (KG)</th>
              <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Total Peso Facturación {new Date().getFullYear() - 3} (KG)</th>
              <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{new Date().getFullYear() - 3}</th>
              <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{new Date().getFullYear() - 2}</th>
              <th colSpan={1} rowSpan={2} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{new Date().getFullYear() - 1}</th>
            </tr>
            <tr className="bg-gray-200">
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total del producto</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto, index) => (
              <tr key={index} className="border-t text-center">
                <td className="p-2">{producto.idProductosB}</td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value={producto.razonSocial} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value={producto.idInformacionB.nit} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value={producto.idInformacionB.origen} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueComercialRX} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoTotalComercialRX} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueComercialOTC} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoTotalComercialOTC} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueInstitucional} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoTotalInstitucional} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueIntrahospitalario} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoTotalIntrahospitalario} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueMuestrasMedicas} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.pesoTotalMuestrasMedicas} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.totalPesoEmpaques} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={producto.totalPesoProducto} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value={(
                    (Number(producto.pesoTotalComercialRX) || 0) + 
                    (Number(producto.pesoTotalComercialOTC) || 0) + 
                    ((Number(producto.pesoTotalInstitucional) || 0) / 2) + 
                    (Number(producto.pesoTotalMuestrasMedicas) || 0)
                  ).toFixed(2)} readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value="0" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value="0" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="number" value="0" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value="No info" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value="No info" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value="No info" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value="Grupo 2" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value="CONFORME" readOnly />
                </td>
                <td className="min-w-[100px] p-1 border border-gray-300">
                  <input className="border p-1 w-full" type="text" value="SE MANTIENE" readOnly />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="bg-green text-white mr-3 px-4 py-2 rounded" onClick={handleFirmar}>Firmar</button>
        <button className="bg-orange-500 text-white mr-3 px-4 py-2 rounded" onClick={handleRechazar}>Rechazar</button>
        <button className="bg-blueGray-600 text-white px-4 py-2 rounded" onClick={goBack}>Atrás</button>
      </div>
    </div>
  );
}

CardTable.propTypes = {
  color: PropTypes.string,
};
