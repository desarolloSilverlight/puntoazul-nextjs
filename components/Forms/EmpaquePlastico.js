import React, { useState } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const agregarProducto = () => {
    setProductos([...productos, { id: productos.length + 1 }]);
  };
  const plasticsData = [
    { code: "BA", type: "PET", unit: "Gramos", description: "(Polietilentereftalato) Es un plástico transparente y ligero, común en botellas de agua y bebidas. Se puede reconocer porque es claro, rígido y suele llevar el número 1 dentro del símbolo de reciclaje." },
    { code: "BB", type: "HDPE", unit: "Gramos", description: "(Polietileno de alta densidad) Es más opaco y resistente, común en envases de detergentes y productos de limpieza. Se puede identificar por su textura rígida y generalmente lleva el número 2 en el símbolo de reciclaje." },
    { code: "BC", type: "PVC", unit: "Gramos", description: "(Policloruro de vinilo) Es un plástico rígido o flexible, usado en tuberías y algunos envases de alimentos. Suele ser más difícil de doblar y lleva el número 3 en el símbolo de reciclaje." },
    { code: "BD", type: "LDPE", unit: "Gramos", description: "(Polietileno de baja densidad) es un plástico flexible y ligero, común en bolsas de plástico, envolturas y algunos tipos de envases. Se puede reconocer por su textura suave y flexible, y generalmente lleva el número 4 en el símbolo de reciclaje." },
    { code: "BE", type: "PP", unit: "Gramos", description: "(Polipropileno) es un plástico resistente al calor, común en tapas de botellas, envases de alimentos y productos médicos. Se puede reconocer porque es rígido pero ligero, y generalmente lleva el número 5 en el símbolo de reciclaje." },
    { code: "BF", type: "PS", unit: "Gramos", description: "(Poliestireno) es un plástico ligero y frágil, utilizado en vasos desechables, envases de comida y materiales de embalaje. Se puede reconocer por su textura rígida o espumosa y suele llevar el número 6 en el símbolo de reciclaje." },
    { code: "BG", type: "OTROS", unit: "Gramos", description: "(Otros) se refiere a plásticos que no entran en las categorías comunes (1 a 6), como mezclas de diferentes tipos de plásticos o plásticos menos frecuentes. Se pueden reconocer por llevar el número 7 en el símbolo de reciclaje y suelen ser más difíciles de reciclar." }
  ];

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
          Empaques Plasticos&nbsp;
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
        <div className="overflow-x-auto mt-4">
          <table className="w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-blueGray-50 text-blueGray-500 text-center">
                <th rowSpan="3" className="p-2">No.</th>
                <th rowSpan="3" className="p-2">Empresa Titular</th>
                <th rowSpan="3" className="p-2">Nombre Producto</th>
                <th rowSpan="3" className="p-2">Peso Unitario (g)</th>
                <th rowSpan="3" className="p-2">Unidades</th>
                <th colSpan="7" className="p-2 border">Líquidos</th>
                <th colSpan="7" className="p-2 border">Otros Productos Plásticos</th>
                <th colSpan="7" className="p-2 border">Plásticos de Construcción</th>
                <th rowSpan="3" className="p-2">Excepciones Ley 2232</th>
                <th rowSpan="3" className="p-2">Prohibiciones Ley 2232</th>
              </tr>
              <tr className="bg-gray-200 text-gray-700 text-center">
                {[...Array(3)].flatMap(() =>
                  ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map(
                    (item, index) => (
                      <th key={index} className="p-2 border">{item} (g)</th>
                    )
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-t text-center">
                  <td className="p-2">{producto.id}</td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="text" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  <td><input className="border p-1 w-full" type="number" /></td>
                  {[...Array(21)].map((_, i) => (
                    <td key={i}><input className="border p-1 w-full" type="number" /></td>
                  ))}
                  {/* Select de excepciones */}
                  <td>
                    <select className="border p-1 w-full">
                      <option value="">Seleccionar...</option>
                      <option value="medicos">Propósitos médicos</option>
                      <option value="quimicos">Químicos con riesgo a la salud humana o al medio ambiente</option>
                      <option value="alimentos">Alimentos, líquidos y bebidas de origen animal, por razones de asepsia o inocuidad</option>
                      <option value="higiene">Fines específicos que por razones de higiene o salud requieren bolsa</option>
                      <option value="asistencia">Uso del plástico en los establecimientos que brindan asistencia médica</option>
                      <option value="impacto">Los plásticos de un solo uso cuyos sustitutos tengan un impacto ambiental y humano mayor</option>
                      <option value="residuos">Empacar o envasar residuos peligrosos</option>
                      <option value="reciclado">Aquellos productos fabricados con 100% de materia reciclada</option>
                      <option value="pitillos">Pitillos adheridos a envases de hasta 300 ml con sistema de retención</option>
                    </select>
                  </td>
                  {/* Select de prohibiciones */}
                  <td>
                    <select className="border p-1 w-full">
                      <option value="">Seleccionar...</option>
                      <option value="bolsas_pago">Bolsas de punto de pago (2024)</option>
                      <option value="bolsas_publicidad">Bolsas para publicidad, facturas y lavanderías (2024)</option>
                      <option value="rollos_bolsas">Rollos de bolsas vacías en comercios (2024)</option>
                      <option value="mezcladores_pitillos">Mezcladores y pitillos para bebidas (2024)</option>
                      <option value="soportes_bombas">Soportes plásticos para bombas de inflar (2024)</option>
                      <option value="soportes_copitos">Soportes plásticos de los hisopos flexibles (2024)</option>
                      <option value="envases_liquidos">Envases y bolsas para líquidos no preenvasados (2030)</option>
                      <option value="platos_utensilios">Platos, bandejas, cubiertos, vasos y guantes para comer (2030)</option>
                      <option value="confeti_manteles">Confeti, manteles y serpentinas (2030)</option>
                      <option value="empaques_alimentos">Empaques para comidas no preenvasadas (2030)</option>
                      <option value="laminas_alimentos">Láminas para servir o envolver alimentos (2030)</option>
                      <option value="empaques_frutas">Empaques para frutas, verduras y tubérculos frescos (2030)</option>
                      <option value="adhesivos_etiquetas">Adhesivos, etiquetas o distintivos en vegetales (2030)</option>
                    </select>
                  </td>
                  <td><button className="bg-red-500 text-white px-4 py-1 rounded">Eliminar</button></td>
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
      </div>
      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-5 rounded-lg shadow-lg max-h-260-px overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-blue-600 text-white">
                    <th className="border px-4 py-2">Código</th>
                    <th className="border px-4 py-2">Tipo</th>
                    <th className="border px-4 py-2">Unidad</th>
                    <th className="border px-4 py-2">Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {plasticsData.map((plastic) => (
                    <tr key={plastic.code} className="border">
                      <td className="border px-4 py-2 text-center">{plastic.code}</td>
                      <td className="border px-4 py-2 text-center">{plastic.type}</td>
                      <td className="border px-4 py-2 text-center">{plastic.unit}</td>
                      <td className="border px-4 py-2">{plastic.description}</td>
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