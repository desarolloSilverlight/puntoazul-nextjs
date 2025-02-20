import React, { useState } from "react";
import PropTypes from "prop-types";

const departamentos = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", 
  "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guajira", 
  "Guanía", "Guaviare", "Huila", "Magdalena", "Meta", "Nariño", "Norte de Santander", 
  "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", 
  "Valle del Cauca", "Vaupés", "Vichada", "TOTAL"
];

export default function FormularioDepartamentos({ color }) {
  const [filas, setFilas] = useState([]);

  const agregarFila = () => {
    setFilas([...filas, { departamento: "", porcentaje: "" }]);
  };

  const actualizarFila = (index, campo, valor) => {
    const nuevasFilas = [...filas];
    nuevasFilas[index][campo] = valor;
    setFilas(nuevasFilas);
  };

  return (
    <div className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${color === "light" ? "bg-white" : "bg-blueGray-700 text-white"}`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold">Asignación de Departamentos</h3>

        {/* Botón para agregar filas */}
        <button onClick={agregarFila} className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3">
          Agregar Departamento
        </button>

        {/* Tabla Dinámica */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-blueGray-50 text-blueGray-500">
                <th className="p-2">Departamento</th>
                <th className="p-2">AU (%)</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, index) => (
                <tr key={index} className="border-t">
                  <td>
                    <select 
                      className="border p-1 w-full"
                      value={fila.departamento}
                      onChange={(e) => actualizarFila(index, "departamento", e.target.value)}
                    >
                      <option value="">Seleccione un departamento</option>
                      {departamentos.map((dep, i) => (
                        <option key={i} value={dep}>{dep}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="number" 
                      className="border p-1 w-full"
                      value={fila.porcentaje}
                      onChange={(e) => actualizarFila(index, "porcentaje", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Textareas debajo de la tabla */}
        <div className="mt-6">
          <label className="block font-medium">1. ¿Cuál es el desempeño actual?</label>
          <textarea className="border p-2 w-full" rows="3"></textarea>

          <label className="block mt-4 font-medium">2. ¿Cuáles son los principales desafíos?</label>
          <textarea className="border p-2 w-full" rows="3"></textarea>

          <label className="block mt-4 font-medium">3. ¿Qué mejoras se pueden implementar?</label>
          <textarea className="border p-2 w-full" rows="3"></textarea>
          
          <label className="block mt-4 font-medium">4. ¿Observaciones?</label>
          <textarea className="border p-2 w-full" rows="3"></textarea>
        </div>

        <button
          className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
        >
          Guardar
        </button>
      </div>
      
    </div>
  );
}

FormularioDepartamentos.propTypes = {
  color: PropTypes.string,
};
