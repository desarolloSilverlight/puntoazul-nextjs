import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';
export default function FormularioAfiliado({ color, readonly = false, idInformacionF: propIdInformacionF, estado: propEstado }) {
  const [isLoading, setIsLoading] = useState(false);
  let idInformacionF = propIdInformacionF || localStorage.getItem("idInformacionF");
  let estadoInformacionF = propEstado || localStorage.getItem("estadoInformacionF");
  let tipoReporte = localStorage.getItem("tipoReporte");
  // Solo editable si estado es Guardado o Rechazado Y no está en modo readonly
  const esEditable = !readonly && (estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado");
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toneladasAcumuladasGlobal, setToneladasAcumuladasGlobal] = useState(0);

  // Mover fetchToneladasAcumuladas fuera de los hooks para que esté disponible globalmente
  const fetchToneladasAcumuladas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/getToneladasAcumuladas/${idInformacionF}`);
      if (!response.ok) throw new Error("No se pudo obtener toneladas acumuladas");
      const data = await response.json();
      setToneladasAcumuladasGlobal(Number(data.toneladas) || 0);
    } catch {
      setToneladasAcumuladasGlobal(0);
    }
  };

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPrimarios/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques primarios para este idInformacion.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        const productosFormateados = data.map(producto => ({
          id: producto.idEmpaque,
          idInformacionF: producto.idInformacionF,
          empresaTitular: producto.empresa || "",
          nombreProducto: producto.nombre_producto || "",
          papel: producto.papel || "",
          metalFerrosos: producto.metal_ferrosos || "",
          metalNoFerrosos: producto.metal_no_ferrososs || "",
          carton: producto.carton || "",
          vidrio: producto.vidrios || "",
          multimaterial: typeof producto.multimaterial === 'string'
            ? (() => { try { return JSON.parse(producto.multimaterial); } catch { return { multimaterial: "", tipo: "", otro: "" }; } })()
            : (producto.multimaterial && typeof producto.multimaterial === 'object' ? producto.multimaterial : { multimaterial: "", tipo: "", otro: "" }),
          unidades: tipoReporte === "totalizado" ? "1" : (producto.unidades || ""),
        }));
        setProductos(productosFormateados);
      } catch (error) {
        console.error("Error al obtener los empaques primarios:", error);
      }
    };
    if (idInformacionF) {
      fetchProductos();
    }
  }, [idInformacionF, tipoReporte]);

  useEffect(() => {
    if (idInformacionF) {
      fetchToneladasAcumuladas();
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
        papel: 0,
        metalFerrosos: 0,
        metalNoFerrosos: 0,
        carton: 0,
        vidrio: 0,
        multimaterial: { multimaterial: "", tipo: "", otro: "" },
        unidades: tipoReporte === "totalizado" ? "1" : "",
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    if (field.startsWith("multimaterial.")) {
      const subField = field.split(".")[1];
      nuevosProductos[index].multimaterial = {
        ...nuevosProductos[index].multimaterial,
        [subField]: value
      };
    } else {
      const sanitizedValue = value.replace(",", ".");
      nuevosProductos[index][field] = sanitizedValue;
    }
    // Si tipoReporte es totalizado y se intenta cambiar unidades, forzar a 1
    if (tipoReporte === "totalizado") {
      nuevosProductos[index].unidades = "1";
    }
    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Validaciones requeridas
    const camposNumericos = ["papel", "metalFerrosos", "metalNoFerrosos", "carton", "vidrio"];
    const decimalRegex = /^\d+(\.\d{1,10})?$/;
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // 1. empresaTitular y nombreProducto requeridos
      if (!producto.empresaTitular || !producto.nombreProducto) {
        alert(`En la fila ${i + 1}, 'Empresa titular' y 'Nombre Producto' son obligatorios.`);
        setIsLoading(false);
        return;
      }
      // 2. Al menos un material debe ser mayor a 0
      const sumaMateriales = [
        Number(producto.papel) || 0,
        Number(producto.metalFerrosos) || 0,
        Number(producto.metalNoFerrosos) || 0,
        Number(producto.carton) || 0,
        Number(producto.vidrio) || 0
      ];
      if (sumaMateriales.every(val => val === 0)) {
        alert(`En la fila ${i + 1}, al menos uno de los materiales (Papel, Metal Ferrosos, Metal No Ferrosos, Cartón, Vidrio) debe ser mayor a 0.`);
        setIsLoading(false);
        return;
      }
      // 3. Validar campos numéricos
      for (const campo of camposNumericos) {
        let valor = producto[campo];
        if (valor !== "" && valor !== null && valor !== undefined) {
          valor = valor.toString().replace(/,/g, ".");
          if (!decimalRegex.test(valor)) {
            alert(`El campo '${campo}' en la fila ${i + 1} debe ser un número decimal válido (máx 10 decimales). Valor ingresado: ${producto[campo]}`);
            setIsLoading(false);
            return;
          }
          productos[i][campo] = valor;
        }
      }
      // 4. Multimaterial no puede quedar en "Seleccione..."
      if (!producto.multimaterial.multimaterial) {
        alert(`En la fila ${i + 1}, debe seleccionar una opción para 'Multimaterial'.`);
        setIsLoading(false);
        return;
      }
      // 5. Unidades debe tener un valor
      if (!producto.unidades || producto.unidades === "") {
        alert(`En la fila ${i + 1}, el campo 'Unidades' es obligatorio.`);
        setIsLoading(false);
        return;
      }
    }
    try {
      // Serializar multimaterial como string para el backend
      const productosSerializados = productos.map(p => ({
        ...p,
        multimaterial: JSON.stringify({
          multimaterial: p.multimaterial.multimaterial,
          tipo: p.multimaterial.tipo,
          otro: p.multimaterial.otro
        })
      }));
      const response = await fetch(`${API_BASE_URL}/informacion-f/crearEmpaquePri`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(productosSerializados),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("Respuesta de la API:", result);
      alert(result.message);
      await fetchToneladasAcumuladas();
      // No recargar la página
    } catch (error) {
      console.error("Error al enviar los empaques primarios:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        "flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded relative " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
      style={{ minHeight: '100vh' }}
    >
      {/* Loader Backdrop Overlay */}
      <Backdrop
        sx={{ color: '#2563eb', zIndex: (theme) => theme.zIndex.modal + 1000 }}
        open={isLoading}
      >
        <div className="flex flex-col items-center">
          <Oval
            height={60}
            width={60}
            color="#2563eb"
            secondaryColor="#60a5fa"
            strokeWidth={5}
            ariaLabel="oval-loading"
            visible={true}
          />
          <span className="text-blue-700 font-semibold mt-4 bg-white px-4 py-2 rounded-lg shadow">Guardando información...</span>
        </div>
      </Backdrop>
      
      {/* Modal usando react-modal, igual que Informacion.js */}
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
                <th className="border border-gray-300 px-4 py-2">Campo</th>
                <th className="border border-gray-300 px-4 py-2">Tipo</th>
                <th className="border border-gray-300 px-4 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Empresa titular del Producto", "Texto", "Razón social/Nombre de cada persona natural o jurídica (titular de registro) representada por la empresa vinculada a Soluciones Ambientales Sostenibles Punto Azul"],
                ["Nombre del Producto", "Texto", "Nombre del producto que está reportando"],
                ["Papel (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de PAPEL."],
                ["Metal Ferrosos(g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de METAL."],
                ["Metal No Ferrosos(g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de METAL NO FERROSO."],
                ["Cartón (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de CARTÓN."],
                ["Vidrio (g)", "Gramos", "Cantidad de GRAMOS referente al peso unitario del Empaque y Envase de cada unidad de producto. Aplica si el empaque y envase es de VIDRIO."],
                ["Multimaterial", "Texto", "Producto o empaque hecho de dos o más materiales diferentes combinados, como plástico y metal, en una sola estructura."],
                ["Unidades del Producto puestas en el mercado", "Número", "Total de empaques puestos en el mercado del Producto indicado durante el año reportado."],
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
      </Modal>
      {/* SECCIÓN II */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold flex items-center">
          Información General de Productos&nbsp;
          <i
            className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
            onClick={() => setIsOpen(true)}
          ></i>
        </h3>
        <div className="mt-2 mb-2 text-blue-700 font-bold text-lg">
          Toneladas acumuladas (Base): {Number(toneladasAcumuladasGlobal).toFixed(10)}
        </div>
        {!readonly && (
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
        )}
        <div className="text-red-500 text-center mt-3 font-semibold">
          Todos los pesos de la tabla deben estar en gramos y sin separador de miles.
        </div>
        {/* ...existing code for the form and table... */}
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-2 py-1">No.</th>
                  <th className="border border-gray-300 px-2 py-1">Empresa titular</th>
                  <th className="border border-gray-300 px-2 py-1">Nombre Producto</th>
                  <th className="border border-gray-300 px-2 py-1">Papel (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Metal Ferrosos (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Metal No Ferrosos (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Cartón (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Vidrio (g)</th>
                  <th className="border border-gray-300 px-2 py-1">Multimaterial</th>
                  <th className="border border-gray-300 px-2 py-1">Unidades</th>
                  {!readonly && <th className="border border-gray-300 px-2 py-1">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={readonly ? 10 : 11} className="text-center py-2">No hay productos guardados.</td>
                  </tr>
                ) : (
                  productos.map((producto, idx) => (
                    <tr key={producto.id || idx} className="hover:bg-gray-100 text-center">
                      <td className="border border-gray-300 px-2 py-1">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "empresaTitular", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.empresaTitular}
                          </div>
                        ) : (
                          <div className="p-1">{producto.empresaTitular}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "nombreProducto", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.nombreProducto}
                          </div>
                        ) : (
                          <div className="p-1">{producto.nombreProducto}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "papel", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.papel}
                          </div>
                        ) : (
                          <div className="p-1">{producto.papel}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "metalFerrosos", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.metalFerrosos}
                          </div>
                        ) : (
                          <div className="p-1">{producto.metalFerrosos}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "metalNoFerrosos", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.metalNoFerrosos}
                          </div>
                        ) : (
                          <div className="p-1">{producto.metalNoFerrosos}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "carton", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.carton}
                          </div>
                        ) : (
                          <div className="p-1">{producto.carton}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "vidrio", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.vidrio}
                          </div>
                        ) : (
                          <div className="p-1">{producto.vidrio}</div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {esEditable ? (
                          <>
                            <select
                              value={producto.multimaterial.multimaterial}
                              onChange={e => handleChange(idx, "multimaterial.multimaterial", e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={!esEditable}
                            >
                              <option value="">Seleccione...</option>
                              <option value="Sí">Sí</option>
                              <option value="No">No</option>
                            </select>
                            {producto.multimaterial.multimaterial === "Sí" && (
                              <select
                                value={producto.multimaterial.tipo}
                                onChange={e => handleChange(idx, "multimaterial.tipo", e.target.value)}
                                className="w-full mt-1 p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={!esEditable}
                              >
                                <option value="">Seleccione tipo...</option>
                                <option value="Papel multimaterial o laminado">Papel multimaterial o laminado</option>
                                <option value="Polyboard - papel para bebidas">Polyboard - papel para bebidas</option>
                                <option value="Carton multimaterial o laminado">Cartón multimaterial o laminado</option>
                                <option value="Carton para bebidas">Cartón para bebidas</option>
                                <option value="Otro">Otro</option>
                              </select>
                            )}
                            {producto.multimaterial.multimaterial === "Sí" && producto.multimaterial.tipo === "Otro" && (
                              <input
                                type="text"
                                className="w-full mt-1 p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Especifique otro tipo"
                                value={producto.multimaterial.otro}
                                onChange={e => handleChange(idx, "multimaterial.otro", e.target.value)}
                                disabled={!esEditable}
                              />
                            )}
                          </>
                        ) : (
                          <div className="p-1">
                            {producto.multimaterial && typeof producto.multimaterial === 'object'
                              ? `${producto.multimaterial.multimaterial || ''} ${producto.multimaterial.tipo || ''} ${producto.multimaterial.otro || ''}`
                              : ''}
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-2 py-1">
                        {tipoReporte === "totalizado" ? (
                          <div className="w-fit max-w-full p-1 border border-gray-300 bg-gray-100 text-center">1</div>
                        ) : esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(idx, "unidades", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.unidades}
                          </div>
                        ) : (
                          <div className="p-1">{producto.unidades}</div>
                        )}
                      </td>
                      {!readonly && (
                        <td className="border border-gray-300 px-2 py-1">
                          <button
                            className="bg-red-500 text-white px-4 py-1 rounded"
                            onClick={e => { e.preventDefault(); setProductos(productos.filter((_, i) => i !== idx)); }}
                            disabled={!esEditable}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
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

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
