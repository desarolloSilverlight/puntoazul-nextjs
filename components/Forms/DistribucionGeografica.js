import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

const departamentos = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", 
  "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guajira", 
  "Guanía", "Guaviare", "Huila", "Magdalena", "Meta", "Nariño", "Norte de Santander", 
  "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", 
  "Valle del Cauca", "Vaupés", "Vichada", "TOTAL"
];

export default function FormularioDepartamentos({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF");
  let estado = localStorage.getItem("estadoInformacion");
  const [filas, setFilas] = useState([]);
  const [pregunta1, setPregunta1] = useState("");
  const [pregunta2, setPregunta2] = useState("");
  const [pregunta3, setPregunta3] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Obtener datos desde el backend al cargar el componente
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-f/getDistribucionGeografica/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron datos de distribución geográfica para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos de distribución geográfica obtenidos:", data);
        
        // Convertir el objeto de departamentos a array de filas
        const departamentosArray = Object.entries(data.departamentos || {}).map(([departamento, porcentaje]) => ({
          departamento,
          porcentaje
        }));
        
        setFilas(departamentosArray);
        setPregunta1(data.pregunta1 || "");
        setPregunta2(data.pregunta2 || "");
        setPregunta3(data.pregunta3 || "");
        setObservaciones(data.observaciones || "");
      } catch (error) {
        console.error("Error al obtener los datos de distribución geográfica:", error);
      }
    };

    if (idInformacionF) {
      fetchDatos();
    }
  }, [idInformacionF]);

  const agregarFila = () => {
    setFilas([...filas, { departamento: "", porcentaje: "" }]);
  };

  const actualizarFila = (index, campo, valor) => {
    const nuevasFilas = [...filas];
    const sanitizedValue = campo === "porcentaje" ? valor.replace(",", ".") : valor;
    nuevasFilas[index][campo] = sanitizedValue;
    setFilas(nuevasFilas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que todos los campos requeridos estén llenos
    const camposRequeridos = filas.filter(fila => !fila.departamento || !fila.porcentaje);
    if (camposRequeridos.length > 0) {
      alert("Por favor complete todos los campos de departamentos y porcentajes.");
      return;
    }

    // Convertir el array de filas a un objeto de departamentos
    const departamentosObj = {};
    filas.forEach(fila => {
      if (fila.departamento && fila.porcentaje) {
        departamentosObj[fila.departamento] = parseFloat(fila.porcentaje);
      }
    });

    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-f/crearDistribucion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idInformacionF,
          departamentos: departamentosObj,
          pregunta1,
          pregunta2,
          pregunta3,
          observaciones
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API:", result);
      alert(result.message);
    } catch (error) {
      console.error("Error al enviar los datos de distribución geográfica:", error);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${color === "light" ? "bg-white" : "bg-blueGray-700 text-white"}`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Asignación de Departamentos&nbsp;
          <i 
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer" 
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <form onSubmit={handleSubmit}>
          {/* Botón para agregar filas */}
          <button 
            type="button"
            onClick={agregarFila} 
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={estado === "Aprobado"}
          >
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
                        disabled={estado === "Aprobado"}
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
                        disabled={estado === "Aprobado"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Textareas debajo de la tabla */}
          <div className="mt-6">
            <label className="block font-medium">¿La empresa actualmente realiza interna o externamente actividades
              dirigidas al aprovechamiento de materiales (reciclaje, reutilización, reprocesamiento, aprovechamiento
              energético, tratamiento fisicoquímico, tratamiento térmico, etc.)? (SI/NO) Cuales? Cuenta actualmente con
               gestores formales o informales para realizar el procesamiento o manejo de estos materiales? (AV)							
            </label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={pregunta1}
              onChange={(e) => setPregunta1(e.target.value)}
              disabled={estado === "Aprobado"}
            ></textarea>

            <label className="block mt-4 font-medium">¿La empresa actualmente realiza actividades dirigidas a la investigación 
              y desarrollo para la innovación de empaques y envases o mecanismos de ecodiseño? Cuales?  (AW)									
            </label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={pregunta2}
              onChange={(e) => setPregunta2(e.target.value)}
              disabled={estado === "Aprobado"}
            ></textarea>

            <label className="block mt-4 font-medium">¿La empresa realiza actividades dirigidas a la sensibilización o 
              capacitaciones de la gestión ambiental de residuos, al interior o exterior de la empresa? Cuáles? (AX)									
            </label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={pregunta3}
              onChange={(e) => setPregunta3(e.target.value)}
              disabled={estado === "Aprobado"}
            ></textarea>
            
            <label className="block mt-4 font-medium">4. ¿Observaciones?</label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={estado === "Aprobado"}
            ></textarea>
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

FormularioDepartamentos.propTypes = {
  color: PropTypes.string,
};
