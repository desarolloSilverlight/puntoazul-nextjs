import React, { useState } from "react";
import PropTypes from "prop-types";

const asociados = [
  { id: 1, nombre: "Juan Pérez", nit: "900123456-7", celular: "3101234567", email: "juan.perez@example.com" },
  { id: 2, nombre: "María Gómez", nit: "901234567-8", celular: "3207654321", email: "maria.gomez@example.com" },
  { id: 3, nombre: "Carlos Ramírez", nit: "902345678-9", celular: "3159876543", email: "carlos.ramirez@example.com" },
  { id: 4, nombre: "Laura Fernández", nit: "903456789-0", celular: "3123456789", email: "laura.fernandez@example.com" },
];

export default function CardTable({ color }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedAsociado, setSelectedAsociado] = useState(null);

  const handleValidar = (asociado) => {
    setSelectedAsociado(asociado);
    setShowForm(true);
  };

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${color === "light" ? "bg-white" : "bg-blueGray-700 text-white"}`}>
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
                  <th className="p-2">Celular</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Acciones</th>
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
                      <button className="bg-lightBlue-600 text-white font-bold text-xs px-4 py-2 rounded shadow hover:shadow-md" onClick={() => handleValidar(asociado)}>
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
                        ["7", "Persona de Contacto", "Texto", "Nombre de la persona encargada de los trámites."],
                        ["8", "Teléfono", "Número", "Teléfono de contacto con el Representante Legal."],
                        ["9", "Cargo", "Texto", "Cargo de la persona de contacto."],
                        ["10", "Correo Electrónico", "Texto", "Correo de la persona de contacto de la empresa."],
                        ["11", "Fecha de diligenciamiento", "Número", "Fecha de presentación del formulario."],
                        ["12", "Año reportado", "Número", "Año para el cual se reporta la información."],
                        ["13", "Empresas Representadas", "Número", "Cantidad de empresas representadas en el plan."]
                      ].map((row, index) => (
                        <tr key={index} className="hover:bg-gray-100">
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="border border-gray-300 px-4 py-2">{cell}</td>
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
        <FormValidarB asociado={selectedAsociado} goBack={() => setShowForm(false)} />
      )}
    </div>
  );
}

function FormValidarB({ asociado, goBack }) {
  const [productos, setProductos] = useState([
    { id: 1, razonSocial: asociado.nombre || "", nit: asociado.nit || "", pesoEmpaque: "", pesoProducto: "" }
  ]);

  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1, razonSocial: "", nit: "", pesoEmpaque: "", pesoProducto: "" }]);
  };

  return (
    <div className="p-4 bg-white shadow-lg rounded">
      <h3 className="text-lg font-semibold">Validacion {productos[0].razonSocial}</h3>
      <div className="overflow-x-auto mt-4">
        <table className="w-full bg-transparent border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th rowSpan={4} colSpan={1} className="p-2 border">Item</th>
              <th rowSpan={4} colSpan={1} className="p-2 border">Razón Social</th>
              <th rowSpan={4} colSpan={1} className="p-2 border">NIT</th>
              <th rowSpan={4} colSpan={1} className="p-2 border">Origen de capital MUNTINACIONAL / NACIONAL</th>
              <th colSpan={10} rowSpan={1} className="p-2 border">Distribución y comercialización AÑO 2023</th>
              
              <th rowSpan={4} className="p-2 border">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
              <th rowSpan={4} className="p-2 border">TOTAL DE PESO DEL PRODUCTO (2023)</th>
              <th colSpan={5} rowSpan={2} className="p-2 border">Comparativo Peso Facturación</th>
              <th colSpan={4} rowSpan={2} className="p-2 border">Grupo</th>
              <th colSpan={1} rowSpan={4} className="p-2 border">Conformidad según literal</th>
              <th colSpan={1} rowSpan={4} className="p-2 border">Tendencia de comportamiento</th>
              <th colSpan={1} rowSpan={4} className="p-2 border">Validación HSEQ <br /> Datos / Firma y Grupo</th>
            </tr>
            <tr className="bg-gray-200">
              <th colSpan={4} rowSpan={1} className="p-2 border">Comercial</th>
              <th colSpan={2} rowSpan={2} className="p-2 border">Institucional</th>
              <th colSpan={2} rowSpan={2} className="p-2 border">Intrahospitalario</th>
              <th colSpan={2} rowSpan={2} className="p-2 border">Muestras médicas</th>           
            </tr>
            <tr className="bg-gray-200">
              <th colSpan={2} className="p-2 border">RX</th>
              <th colSpan={2} className="p-2 border">OTC</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">Total Peso Facturación 2023 (KG)</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">Total Peso Facturación 2022 (KG)</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">Total Peso Facturación 2021 (KG)</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">Total Peso Facturación 2020 (KG)</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">Total Peso Facturación 2019 (KG)</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">2020</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">2021</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">2022</th>
              <th colSpan={1} rowSpan={2} className="p-2 border">2023</th>
            </tr>
            <tr className="bg-gray-200">
              <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="p-2 border">Peso total del producto</th>
              <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="p-2 border">Peso total del producto</th>
              <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="p-2 border">Peso total del producto</th>
              <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="p-2 border">Peso total del producto</th>
              <th colSpan={1} className="p-2 border">Peso de empaques, envases y envolturas</th>
              <th colSpan={1} className="p-2 border">Peso total del producto</th>              
            </tr>
          </thead>
          <tbody>
            {productos.map((producto, index) => (
              <tr key={index} className="border-t">
                <td className="p-2">{producto.id}</td>
                <td><input className="border p-1 w-full" type="text" value={producto.razonSocial} readOnly /></td>
                <td><input className="border p-1 w-full" type="text" value={producto.nit} readOnly /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><input className="border p-1 w-full" type="number" /></td>
                <td><button className="bg-lightBlue-600 text-white font-bold text-xs px-4 py-2 rounded shadow hover:shadow-md">
                  Firmar
                </button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="bg-green text-white mr-3 px-4 py-2 rounded">Guardar</button>
        <button className="bg-blueGray-600 text-white px-4 py-2 rounded" onClick={goBack}>Atrás</button>
      </div>
    </div>
  );
}

CardTable.propTypes = {
  color: PropTypes.string,
};
