import React, { useState, useEffect } from "react";
import Backdrop from "@mui/material/Backdrop";
import { Oval } from "react-loader-spinner";
import { API_BASE_URL } from "../../utils/config";
import Modal from "react-modal";
import PropTypes from "prop-types";

export default function TablaRetornabilidad({ color, readonly = false, idInformacionF: propIdInformacionF }) {
  // Necesario para accesibilidad con react-modal
  if (typeof window !== "undefined") {
    Modal.setAppElement("#__next");
  }
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  let idInformacionF = propIdInformacionF || localStorage.getItem("idInformacionF") || 0;
  let estadoInformacionF = localStorage.getItem("estadoInformacionF");
  // Solo editable si estado es Guardado o Rechazado y no está en modo readonly
  const esEditable = !readonly && (estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado");
  const [datos, setDatos] = useState({
    parametros: {
      "EERM": "(1) EERM",
      "EER": "(2) EER",
      "EENC": "(3) EENC",
      "EERI": "(4) EERI",
      "ER": "(5) ER",
      "EENC_EERI": "(EENC +  EERI)",
      "MATERIAL_70": "Material con % mayor al 70% (*)",
      "NINGUN_MATERIAL_70": "Ningún material con % mayor al 70%  (**)",
      "MATERIAL_1": "Material 1",
      "MATERIAL_2": "Material 2",
      "MATERIAL_3": "Material 3",
      "MULTIMATERIAL_N": "Multimaterial n"
    },
    pesoTotal: {},
    papel: {},
    carton: {},
    plasticoRigidos: {},
    plasticoFlexibles: {},
    vidrio: {},
    metalesFerrosos: {},
    metalesNoFerrosos: {},
    multimaterial1: {},
    multimaterialn: {},
    descripcion: {}
  });

  // Obtener datos desde el backend al cargar el componente
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEnvasesRetornables/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron envases retornables para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Envases retornables obtenidos:", data);

        // Procesar los datos recibidos
        if (data && data.length > 0) {
          const primerRegistro = data[0];
          // Función para parsear doble si es necesario
          const safeParse = (value) => {
            try {
              let parsed = JSON.parse(value || "{}")
              if (typeof parsed === "string") {
                parsed = JSON.parse(parsed);
              }
              if (typeof parsed !== "object" || parsed === null) {
                return {};
              }
              return parsed;
            } catch {
              return {};
            }
          };
          const nuevosDatos = {
            ...datos,
            pesoTotal: safeParse(primerRegistro.peso),
            papel: safeParse(primerRegistro.papel),
            carton: safeParse(primerRegistro.carton),
            plasticoRigidos: safeParse(primerRegistro.plasticoRig),
            plasticoFlexibles: safeParse(primerRegistro.platicoFlex),
            vidrio: safeParse(primerRegistro.vidrio),
            metalesFerrosos: safeParse(primerRegistro.metal_ferrosos),
            metalesNoFerrosos: safeParse(primerRegistro.metal_no_ferrososs),
            multimaterial1: safeParse(primerRegistro.multimaterial1),
            multimaterialn: safeParse(primerRegistro.multimaterialn),
            descripcion: safeParse(primerRegistro.descripcion)
          };
          setDatos(nuevosDatos);
        }
      } catch (error) {
        console.error("Error al obtener los envases retornables:", error);
      }
    };

    if (idInformacionF) {
      fetchDatos();
    }
  }, [idInformacionF]);

  const handleChange = (parametro, field, value) => {
    const nuevosDatos = { ...datos };
    const sanitizedValue = value.replace(",", ".");
    nuevosDatos[field][parametro] = sanitizedValue;
    setDatos(nuevosDatos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/crearEnvaseRetornable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          idInformacionF,
          peso: JSON.stringify(datos.pesoTotal),
          papel: JSON.stringify(datos.papel),
          carton: JSON.stringify(datos.carton),
          plasticoRig: JSON.stringify(datos.plasticoRigidos),
          platicoFlex: JSON.stringify(datos.plasticoFlexibles),
          vidrio: JSON.stringify(datos.vidrio),
          metal_ferrosos: JSON.stringify(datos.metalesFerrosos),
          metal_no_ferrososs: JSON.stringify(datos.metalesNoFerrosos),
          multimaterial1: JSON.stringify(datos.multimaterial1),
          multimaterialn: JSON.stringify(datos.multimaterialn),
          descripcion: JSON.stringify(datos.descripcion)
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
      console.error("Error al enviar los envases retornables:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* Loader Overlay */}
      <Backdrop
        sx={{ color: '#fff', zIndex: 1301 }}
        open={loading}
      >
        <Oval
          height={60}
          width={60}
          color="#2563eb"
          secondaryColor="#e0e7ef"
          strokeWidth={5}
          ariaLabel="oval-loading"
          visible={true}
        />
      </Backdrop>
      <div className="p-4">
        <h3 className="text-lg font-semibold flex items-center">
          Cantidad total en peso (toneladas) de materiales de envases y empaques retornables&nbsp;
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        {/* Modal instructivo */}
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
              <tbody>
                <tr><td className="border px-4 py-2" colSpan={2}>(5) ER: eficiencia de retornabilidad</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(1) EERM: peso total de envases y empaques retornables puestos en el mercado, en el año base, en toneladas.</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(2) EER: peso de los envases y empaques efectivamente retornados, en toneladas</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(3) EENC: peso de envases y empaques retornables que no lograron ser recogidos en puntos de generación (no retornados), en toneladas.</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(4) EERI: Peso de envases y empaques retornables que por calidad u otras razones, son rechazados por ineficiencias del proceso de acondicionamiento y no pueden seguir en el ciclo de reutilización para el mismo propósito para el que fueron creados (ineficiencia del proceso).</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>EENC y EERI, en toneladas, se deberá sumar a la linea base de los envases y empaques puestos en el mercado en el año base</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(*) Para los envases y empaques multimateriales, primará para el reporte el material con mayor porcentaje en la composición total del mismo, cuando este material supere el 70% del peso total del envase o empaque, de lo contrario deberá reportar todos los materiales. (Marque con una X)</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(**) Diligenciar solo cuando no hay un material que supere el 70% . (marque con una X)</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(6) Evidencias: certificado entidad  certificadora acreditada por ONAC, o los requisitos establecidos en el anexo V de la Resolución 1342</td></tr>
                <tr><td className="border px-4 py-2" colSpan={2}>(7) Aplica unicamente para las personas naturales o jurídicas que cuenten con sistemas de envases y empaques retornables en el año base.</td></tr>
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
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Parámetro</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso total (ton) Año base</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Papel</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Cartón</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plástico Rígidos</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plástico Flexibles</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Vidrio</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Metales Ferrosos</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Metales No Ferrosos</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Multimaterial 1</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Multimaterial n</th>
                  <th rowSpan={1} colSpan={1} className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Descripción del procedimiento</th>
                </tr>
              </thead>
              <tbody>
                {datos.parametros && Object.entries(datos.parametros).map(([key, parametro]) => (
                  <tr key={key} className="border-t text-center">
                    <td className="p-2">{parametro}</td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.pesoTotal[key] || ""}
                        onChange={e => handleChange(key, "pesoTotal", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.papel[key] || ""}
                        onChange={e => handleChange(key, "papel", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.carton[key] || ""}
                        onChange={e => handleChange(key, "carton", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.plasticoRigidos[key] || ""}
                        onChange={e => handleChange(key, "plasticoRigidos", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.plasticoFlexibles[key] || ""}
                        onChange={e => handleChange(key, "plasticoFlexibles", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.vidrio[key] || ""}
                        onChange={e => handleChange(key, "vidrio", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.metalesFerrosos[key] || ""}
                        onChange={e => handleChange(key, "metalesFerrosos", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.metalesNoFerrosos[key] || ""}
                        onChange={e => handleChange(key, "metalesNoFerrosos", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.multimaterial1[key] || ""}
                        onChange={e => handleChange(key, "multimaterial1", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.multimaterialn[key] || ""}
                        onChange={e => handleChange(key, "multimaterialn", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="min-w-[100px] p-1 border border-gray-300">
                      <input
                        type="text"
                        value={datos.descripcion[key] || ""}
                        onChange={e => handleChange(key, "descripcion", e.target.value)}
                        disabled={!esEditable}
                        className="w-full p-1 border border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!readonly && (
            <button
              type="submit"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
              disabled={!esEditable}
            >
              Guardar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

TablaRetornabilidad.propTypes = {
  color: PropTypes.string,
};
