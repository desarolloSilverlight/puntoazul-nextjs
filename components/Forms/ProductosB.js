import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  let idInformacionB = localStorage.getItem("idInformacionB");
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        id: productos.length + 1,
        idInformacionB,
        razonSocial: "",
        marca: "",
        nombreGenerico: "",
        numeroRegistros: "",
        codigoEstandarDatos: "",
        pesoEmpaqueComercialRX: "",
        pesoTotalComercialRX: "",
        pesoEmpaqueComercialOTC: "",
        pesoTotalComercialOTC: "",
        pesoEmpaqueInstitucional: "",
        pesoTotalInstitucional: "",
        pesoEmpaqueIntrahospitalario: "",
        pesoTotalIntrahospitalario: "",
        pesoEmpaqueMuestrasMedicas: "",
        pesoTotalMuestrasMedicas: "",
        fabricacionLocal: "",
        fabricacionImportado: "",
        totalPesoEmpaques: "",
        totalPesoProducto: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index][field] = value;
    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(typeof productos, Array.isArray(productos), productos);

    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-b/createProductos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify( productos ),
      });

      if (!response.ok) {
        const errorText = await response.text(); // Obtener respuesta en texto para debug
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API:", result); // Ver respuesta en consola
      alert("Productos enviados correctamente");
    } catch (error) {
      console.error("Error al enviar los productos:", error);
      alert(`Error: ${error.message}`); // Mostrar error en una alerta
    }
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* SECCIÓN II */}
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Medicamentos&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="flex justify-between mt-3">
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded" onClick={agregarProducto}>
            Agregar Producto
          </button>
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded">
            Cargar Informacion
          </button>
          <button className="bg-lightBlue-600 text-white px-4 py-2 rounded">
            Descargar Excel
          </button>
        </div>
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en gramos.
        </div>
        <form onSubmit={handleSubmit}>
        <div className="overflow-x-auto mt-4">
          <table className="w-full bg-transparent border-separate table-auto">
            <thead>
              <tr className="bg-gray-200">
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">No.</th>
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">Razón Social</th>
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">Marca</th>
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">Nombre Generico</th>
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">Número de Registros</th>
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">Código de estándar de datos</th>
                <th colSpan={10} rowSpan={1} className="p-2 border border-blueGray-500">Distribución y comercialización</th>  
                <th colSpan={2} rowSpan={1} className="p-2 border border-blueGray-500">Fabricacion</th>              
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">TOTAL DE PESO DE EMPAQUES, ENVASES Y ENVOLTURAS</th>
                <th rowSpan={4} colSpan={1} className="p-2 border border-blueGray-500">TOTAL DE PESO DEL PRODUCTO</th>
              </tr>
              <tr className="bg-gray-200">
                <th colSpan={4} rowSpan={1} className="p-2 border border-blueGray-500">Comercial</th>
                <th colSpan={2} rowSpan={2} className="p-2 border border-blueGray-500">Institucional</th>
                <th colSpan={2} rowSpan={2} className="p-2 border border-blueGray-500">Intrahospitalario</th>
                <th colSpan={2} rowSpan={2} className="p-2 border border-blueGray-500">Muestras médicas</th>           
                <th colSpan={1} rowSpan={3} className="p-2 border border-blueGray-500">Local</th>           
                <th colSpan={1} rowSpan={3} className="p-2 border border-blueGray-500">Importado</th>           
              </tr>
              <tr className="bg-gray-200">
                <th colSpan={2} rowSpan={1} className="p-2 border border-blueGray-500">RX</th>
                <th colSpan={2} rowSpan={1} className="p-2 border border-blueGray-500">OTC</th>
              </tr>
              <tr className="bg-gray-200">
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso total del producto</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso total del producto</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso total del producto</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso total del producto</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso de empaques, envases y envolturas</th>
                <th colSpan={1} className="p-2 border border-blueGray-500">Peso total del producto</th>              
              </tr>
            </thead>
            <tbody>
              {productos.map((producto, index) => (
                <tr key={producto.id} className="border-t text-center">
                  <td className="p-2">{producto.id}</td>
                    <td>
                      <input className="border p-1 w-full" type="text" value={producto.razonSocial} onChange={(e) => handleChange(index, "razonSocial", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="text" value={producto.marca} onChange={(e) => handleChange(index, "marca", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="text" value={producto.nombreGenerico} onChange={(e) => handleChange(index, "nombreGenerico", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.numeroRegistros} onChange={(e) => handleChange(index, "numeroRegistros", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="text" value={producto.codigoEstandarDatos} onChange={(e) => handleChange(index, "codigoEstandarDatos", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueComercialRX} onChange={(e) => handleChange(index, "pesoEmpaqueComercialRX", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoTotalComercialRX} onChange={(e) => handleChange(index, "pesoTotalComercialRX", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueComercialOTC} onChange={(e) => handleChange(index, "pesoEmpaqueComercialOTC", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoTotalComercialOTC} onChange={(e) => handleChange(index, "pesoTotalComercialOTC", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueInstitucional} onChange={(e) => handleChange(index, "pesoEmpaqueInstitucional", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoTotalInstitucional} onChange={(e) => handleChange(index, "pesoTotalInstitucional", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueIntrahospitalario} onChange={(e) => handleChange(index, "pesoEmpaqueIntrahospitalario", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoTotalIntrahospitalario} onChange={(e) => handleChange(index, "pesoTotalIntrahospitalario", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoEmpaqueMuestrasMedicas} onChange={(e) => handleChange(index, "pesoEmpaqueMuestrasMedicas", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.pesoTotalMuestrasMedicas} onChange={(e) => handleChange(index, "pesoTotalMuestrasMedicas", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.fabricacionLocal} onChange={(e) => handleChange(index, "fabricacionLocal", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.fabricacionImportado} onChange={(e) => handleChange(index, "fabricacionImportado", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.totalPesoEmpaques} onChange={(e) => handleChange(index, "totalPesoEmpaques", e.target.value)} />
                    </td>
                    <td>
                      <input className="border p-1 w-full" type="number" value={producto.totalPesoProducto} onChange={(e) => handleChange(index, "totalPesoProducto", e.target.value)} />
                    </td>
                    <td>
                      <button className="bg-red-500 text-white px-4 py-1 rounded" onClick={() => setProductos(productos.filter((_, i) => i !== index))}>
                        Eliminar
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
        >
          Guardar
        </button>
        </form>
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
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};