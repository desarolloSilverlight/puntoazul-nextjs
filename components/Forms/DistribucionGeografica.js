import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
const departamentos = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", 
  "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guajira", 
  "Guanía", "Guaviare", "Huila", "Magdalena", "Meta", "Nariño", "Norte de Santander", 
  "Putumayo", "Quindío", "Risaralda", "San Andrés", "Santander", "Sucre", "Tolima", 
  "Valle del Cauca", "Vaupés", "Vichada"
];

export default function FormularioDepartamentos({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF");
  let estadoInformacionF = localStorage.getItem("estadoInformacionF");
  // Solo editable si estado es Guardado o Rechazado
  const esEditable = estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado";
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
        
        if (data && data.length > 0) {
          const primerRegistro = data[0];
          // Convertir el string JSON de departamentos a un objeto (doble parseo si es necesario)
          let departamentosObj = {};
          try {
            let temp = JSON.parse(primerRegistro.departamentos || "{}") || {};
            if (typeof temp === "string") {
              departamentosObj = JSON.parse(temp);
            } else {
              departamentosObj = temp;
            }
          } catch {
            departamentosObj = {};
          }
          // Convertir el objeto de departamentos a array de filas, filtrando vacíos y asegurando que el porcentaje sea numérico
          const departamentosArray = Object.entries(departamentosObj)
            .filter(([departamento, porcentaje]) => departamento && porcentaje !== undefined && porcentaje !== null && porcentaje !== "")
            .map(([departamento, porcentaje]) => ({
              departamento,
              porcentaje: porcentaje.toString()
            }));
          setFilas(departamentosArray);
          setPregunta1(primerRegistro.pregunta1 || "");
          setPregunta2(primerRegistro.pregunta2 || "");
          setPregunta3(primerRegistro.pregunta3 || "");
          setObservaciones(primerRegistro.observaciones || "");
        }
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

    // Validar que ningún porcentaje individual sea mayor a 100
    for (const fila of filas) {
      const porcentajeNum = parseFloat(fila.porcentaje);
      if (porcentajeNum > 100) {
        alert(`El porcentaje del departamento '${fila.departamento}' no puede ser mayor a 100.`);
        return;
      }
    }

    // Validar que la suma total de porcentajes no supere 100 si hay dos o más departamentos
    if (filas.length > 1) {
      const sumaTotal = filas.reduce((acc, fila) => acc + parseFloat(fila.porcentaje || 0), 0);
      if (sumaTotal > 100) {
        alert("La sumatoria de los porcentajes de todos los departamentos no puede ser mayor a 100.");
        return;
      }
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
          departamentos: JSON.stringify(departamentosObj),
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
            disabled={!esEditable}
          >
            Agregar Departamento
          </button>

          {/* Tabla Dinámica */}
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Departamento</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">AU (%)</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, index) => (
                  <tr key={index} className="border-t text-center">
                    <td>
                      <select 
                        className="border p-1 w-full"
                        value={fila.departamento}
                        onChange={e => actualizarFila(index, "departamento", e.target.value)}
                        disabled={!esEditable}
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
                        onChange={e => actualizarFila(index, "porcentaje", e.target.value)}
                        disabled={!esEditable}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-red-500 text-center mt-3 font-semibold">
            Diligenciar todos los campos para continuar en caso de no tener informacion colocar N/A.
          </div>
          {/* Textareas debajo de la tabla */}
          <div className="mt-6">
            <label className="block font-medium">¿La empresa actualmente realiza interna o externamente actividades
              dirigidas al aprovechamiento de materiales (reciclaje, reutilización, coprocesamiento, aprovechamiento
              energético, tratamiento fisicoquímico, tratamiento térmico, etc.)? (SI/NO) Cuales? Cuenta actualmente con
               gestores formales o informales para realizar el procesamiento o manejo de estos materiales? (AV)							
            </label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={pregunta1}
              onChange={e => setPregunta1(e.target.value)}
              disabled={!esEditable}
            ></textarea>

            <label className="block mt-4 font-medium">¿La empresa actualmente realiza actividades dirigidas a la investigación 
              y desarrollo para la innovación de empaques y envases o mecanismos de ecodiseño? Cuales?  (AW)									
            </label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={pregunta2}
              onChange={e => setPregunta2(e.target.value)}
              disabled={!esEditable}
            ></textarea>

            <label className="block mt-4 font-medium">¿La empresa realiza actividades dirigidas a la sensibilización o 
              capacitaciones de la gestión ambiental de residuos, al interior o exterior de la empresa? Cuáles? (AX)									
            </label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={pregunta3}
              onChange={e => setPregunta3(e.target.value)}
              disabled={!esEditable}
            ></textarea>
            
            <label className="block mt-4 font-medium">4. ¿Observaciones?</label>
            <textarea 
              className="border p-2 w-full" 
              rows="3"
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              disabled={!esEditable}
            ></textarea>
          </div>

          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={!esEditable}
          >
            Guardar
          </button>
        </form>
      </div>
      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        className="mx-auto my-32 bg-white p-5 rounded-lg shadow-lg max-w-xl z-40 max-h-460-px overflow-y-auto outline-none"
        overlayClassName=""
        contentLabel="Instructivo de la sección"
        shouldCloseOnOverlayClick={true}
      >
        <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
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
              {[
                ["AU", "Porcentaje aproximado de unidades distribuidas por departamento", "Porcentaje", "Indicar el porcentaje aproximado de unidades puestos en el mercado de los productos registrados en la Sección II, de acuerdo a los departamentos donde se realice la distribución en su último punto, o donde el consumidor final recibe los productos."],
                ["AV", "¿La empresa actualmente realiza interna o externamente actividades dirigidas al aprovechamiento de materiales (reciclaje, reutilización, reprocesamiento, aprovechamiento energético, tratamiento fisicoquímico, tratamiento térmico, etc.)? (SI/NO) ¿Cuales? ¿Cuenta actualmente con gestores formales o informales para realizar el procesamiento o manejo de estos materiales?", "Texto", "Pregunta abierta. En caso de que la respuesta sea afirmativa, se debe dar respuesta a las preguntas formuladas"],
                ["AW", "¿La empresa actualmente realiza actividades dirigidas a la investigación y desarrollo para la innovación de empaques y envases o mecanismos de ecodiseño? Cuales?", "Texto", "Pregunta abierta. En caso de que la respuesta sea afirmativa, se debe indicar las actividades que se están realizando."],
                ["AX", "¿La empresa realiza actividades dirigidas a la sensibilización o capacitaciones de la gestión ambiental de residuos, al interior o exterior de la empresa? Cuáles?", "Texto", "Pregunta abierta. En caso de que la respuesta sea afirmativa, se debe indicar las actividades que se están realizando."],
                ["AY", "Observaciones", "Texto", "Diligencie aquí cualquier observación que tenga y considere puede ser relevante para la ejecución del Plan."]
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
      </Modal>
    </div>
  );
}

FormularioDepartamentos.propTypes = {
  color: PropTypes.string,
};
