import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF");
  let estado = localStorage.getItem("estadoInformacion");
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const data = [
    ["AA", "Empresa titular del Producto", "Texto", "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa vinculada a Soluciones Ambientales Sostenibles Punto Azul"],
    ["AB", "Nombre del Producto", "Texto", "Nombre del producto que esta reportando"],
    ["AC", "Papel (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de PAPEL. Colocar cifra en gramos."],
    ["AD", "Metal (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de METAL. Colocar cifra en gramos."],
    ["AE", "Cartón (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de CARTÓN. Colocar cifra en gramos. De igual manera se debe reportar el material corrugado como material de cartón."],
    ["AF", "Vidrio (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto que se esta reportando en la fila correspondiente. Aplica en esta casilla si el empaque y envase es de VIDRIO. Colocar cifra en gramos."],
    ["AG", "Multimaterial", "Texto", "Es un producto o empaque hecho de dos o más materiales diferentes combinados, como plástico y metal, en una sola estructura."],
    ["AH", "Unidades del Producto puestas en el mercado durante el año reportado", "Número", "Total de empaques puestos en el mercado del Producto indicado en la fila correspondiente, durante el año reportado. En la cuantificación se debe tener en cuenta la relación con el producto (Ej.: una unidad de empaque contiene 24 unidades de producto, el reporte que se debe hacer es la unidad de empaque que se puso en el mercado."],
  ];

  // Obtener productos desde el backend al cargar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-f/getEmpaquesSecundarios/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques secundarios para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Empaques secundarios obtenidos:", data);
        setProductos(data);
      } catch (error) {
        console.error("Error al obtener los empaques secundarios:", error);
      }
    };

    if (idInformacionF) {
      fetchProductos();
    }
  }, [idInformacionF]);

  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        id: productos.length + 1,
        idInformacionF,
        empresaTitular: "",
        nombreProducto: "",
        papel: "",
        metalFerrosos: "",
        metalNoFerrosos: "",
        carton: "",
        vidrio: "",
        multimaterial: "",
        unidades: "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    const sanitizedValue = value.replace(",", ".");
    nuevosProductos[index][field] = sanitizedValue;
    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-f/crearEmpaqueSec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productos),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API:", result);
      alert(result.message);
    } catch (error) {
      console.error("Error al enviar los empaques secundarios:", error);
      alert(`Error: ${error.message}`);
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
          Información General de Productos&nbsp;
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
            <table className="w-full bg-transparent border-collapse">
              <thead>
                <tr className="bg-blueGray-50 text-blueGray-500">
                  <th className="p-2">No.</th>
                  <th className="p-2">Empresa Titular</th>
                  <th className="p-2">Nombre Producto</th>
                  <th className="p-2">Papel (g)</th>
                  <th className="p-2">Metal Ferrosos(g)</th>
                  <th className="p-2">Metal No Ferrosos(g)</th>
                  <th className="p-2">Cartón (g)</th>
                  <th className="p-2">Vidrio (g)</th>
                  <th className="p-2">Multimaterial</th>
                  <th className="p-2">Unidades</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => (
                  <tr key={producto.id} className="border-t">
                    <td className="p-2">{index + 1}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "empresaTitular", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.empresaTitular}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "nombreProducto", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.nombreProducto}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "papel", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.papel}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "metalFerrosos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.metalFerrosos}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "metalNoFerrosos", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.metalNoFerrosos}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "carton", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.carton}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "vidrio", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.vidrio}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "multimaterial", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.multimaterial}
                      </div>
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <div
                        contentEditable={estado !== "Aprobado"}
                        onBlur={(e) => handleChange(index, "unidades", e.target.textContent || "")}
                        className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                      >
                        {producto.unidades}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="bg-red-500 text-white px-4 py-1 rounded" 
                        onClick={() => setProductos(productos.filter((_, i) => i !== index))}
                        disabled={estado === "Aprobado"}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={estado === "Aprobado"}
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
                    <th className="border border-gray-300 px-4 py-2">Código</th>
                    <th className="border border-gray-300 px-4 py-2">Campo</th>
                    <th className="border border-gray-300 px-4 py-2">Tipo</th>
                    <th className="border border-gray-300 px-4 py-2">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, index) => (
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
