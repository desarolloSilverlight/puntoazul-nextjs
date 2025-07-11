import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF");
  let estado = localStorage.getItem("estadoInformacion");
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Obtener productos desde el backend al cargar el componente
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-f/getEmpaquesPlasticos/${idInformacionF}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron empaques plásticos para este idInformacionF.");
            return;
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Empaques plásticos obtenidos:", data);
        // Mapear los datos recibidos al formato esperado por el componente
        const productosFormateados = data.map(producto => ({
          id: producto.idEmpaque,
          idInformacionF: producto.idInformacionF,
          empresaTitular: producto.empresa || "",
          nombreProducto: producto.nombre_producto || "",
          pesoUnitario: producto.peso || "",
          unidades: producto.unidades || "",
          liquidos: JSON.parse(producto.liquidos || "{}"),
          otrosProductos: JSON.parse(producto.otros || "{}"),
          construccion: JSON.parse(producto.construccion || "{}"),
          excepciones: producto.excepciones || "",
          prohibiciones: producto.prohibiciones || "",
        }));
        setProductos(productosFormateados);
      } catch (error) {
        console.error("Error al obtener los empaques plásticos:", error);
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
        pesoUnitario: "",
        PET: "",
        liquidos: {
          "PET Agua": "",
          "PET Otros": "",
          HDPE: "",
          PVC: "",
          LDPE: "",
          PP: "",
          PS: "",
          Otros: ""
        },
        otrosProductos: {
          PET: "",
          HDPE: "",
          PVC: "",
          LDPE: "",
          PP: "",
          PS: "",
          Otros: ""
        },
        construccion: {
          PET: "",
          HDPE: "",
          PVC: "",
          LDPE: "",
          PP: "",
          PS: "",
          Otros: ""
        },
        excepciones: "",
        prohibiciones: ""
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    const sanitizedValue = value.replace(",", ".");

    if (field.startsWith("liquidos.")) {
      const subField = field.split(".")[1];
      // Asegura que liquidos sea objeto
      if (typeof nuevosProductos[index].liquidos === 'string') {
        try {
          nuevosProductos[index].liquidos = JSON.parse(nuevosProductos[index].liquidos);
        } catch {
          nuevosProductos[index].liquidos = {};
        }
      }
      nuevosProductos[index].liquidos[subField] = sanitizedValue;
    } else if (field.startsWith("otrosProductos.")) {
      const subField = field.split(".")[1];
      if (typeof nuevosProductos[index].otrosProductos === 'string') {
        try {
          nuevosProductos[index].otrosProductos = JSON.parse(nuevosProductos[index].otrosProductos);
        } catch {
          nuevosProductos[index].otrosProductos = {};
        }
      }
      nuevosProductos[index].otrosProductos[subField] = sanitizedValue;
    } else if (field.startsWith("construccion.")) {
      const subField = field.split(".")[1];
      if (typeof nuevosProductos[index].construccion === 'string') {
        try {
          nuevosProductos[index].construccion = JSON.parse(nuevosProductos[index].construccion);
        } catch {
          nuevosProductos[index].construccion = {};
        }
      }
      nuevosProductos[index].construccion[subField] = sanitizedValue;
    } else if (field === "excepciones" || field === "prohibiciones") {
      nuevosProductos[index][field] = value;
    } else {
      nuevosProductos[index][field] = sanitizedValue;
    }

    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Serializar los campos de plásticos solo una vez antes de enviar
    const productosSerializados = productos.map((producto) => ({
      ...producto,
      liquidos: typeof producto.liquidos === 'string' ? producto.liquidos : JSON.stringify(producto.liquidos),
      otros: typeof producto.otrosProductos === 'string' ? producto.otrosProductos : JSON.stringify(producto.otrosProductos),
      construccion: typeof producto.construccion === 'string' ? producto.construccion : JSON.stringify(producto.construccion),
      PET: producto.PET || ""
    }));
    try {
      const response = await fetch("https://nestbackend.fidare.com/informacion-f/crearEmpaquePlastico", {
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
    } catch (error) {
      console.error("Error al enviar los empaques plásticos:", error);
      alert(`Error: ${error.message}`);
    }
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
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">No.</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Empresa Titular</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Producto</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso Unitario (g)</th>
                  <th rowSpan="2" className="min-w-[120px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET</th>
                  <th colSpan="8" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Líquidos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros Productos Plásticos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plásticos de Construcción</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Excepciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Prohibiciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Unidades Puestas en el mercado</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Acciones</th>
                </tr>
                <tr className="bg-gray-200">
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET Agua (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET Otros (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">HDPE (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PVC (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">LDPE (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PP (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PS (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros (g)</th>
                  {['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Otros'].map((item) => (
                    <th key={`otros-${item}`} className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{item} (g)</th>
                  ))}
                  {['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Otros'].map((item) => (
                    <th key={`construccion-${item}`} className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">{item} (g)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map((producto, index) => {
                  // Parsear los campos que vienen como string JSON
                  const liquidos = typeof producto.liquidos === "string" ? JSON.parse(producto.liquidos || "{}") : (producto.liquidos || {});
                  const otrosProductos = typeof producto.otros === "string" ? JSON.parse(producto.otros || "{}") : (producto.otrosProductos || {});
                  const construccion = typeof producto.construccion === "string" ? JSON.parse(producto.construccion || "{}") : (producto.construccion || {});

                  return (
                    <tr key={producto.idEmpaque || index} className="border-t text-center">
                      <td className="p-2 border border-gray-300">{index + 1}</td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <div
                          contentEditable={estado !== "Aprobado"}
                          onBlur={(e) => handleChange(index, "empresaTitular", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.empresa || producto.empresaTitular}
                        </div>
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <div
                          contentEditable={estado !== "Aprobado"}
                          onBlur={(e) => handleChange(index, "nombreProducto", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.nombre_producto || producto.nombreProducto}
                        </div>
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <div
                          contentEditable={estado !== "Aprobado"}
                          onBlur={(e) => handleChange(index, "pesoUnitario", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.peso || producto.pesoUnitario}
                        </div>
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <div
                          contentEditable={estado !== "Aprobado"}
                          onBlur={(e) => handleChange(index, "PET", e.target.textContent || "")}
                          className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                        >
                          {producto.PET || ""}
                        </div>
                      </td>
                      {/* Líquidos */}
                      {["PET Agua", "PET Otros", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`liquidos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          <div
                            contentEditable={estado !== "Aprobado"}
                            onBlur={(e) => handleChange(index, `liquidos.${key}`, e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {liquidos[key] || ""}
                          </div>
                        </td>
                      ))}
                      {/* Otros Productos */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`otrosProductos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          <div
                            contentEditable={estado !== "Aprobado"}
                            onBlur={(e) => handleChange(index, `otrosProductos.${key}`, e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {otrosProductos[key] || ""}
                          </div>
                        </td>
                      ))}
                      {/* Construcción */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`construccion-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          <div
                            contentEditable={estado !== "Aprobado"}
                            onBlur={(e) => handleChange(index, `construccion.${key}`, e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {construccion[key] || ""}
                          </div>
                        </td>
                      ))}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.excepciones}
                          onChange={(e) => handleChange(index, "excepciones", e.target.value)}
                          disabled={estado === "Aprobado"}
                        >
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
                          <option value="no_aplica">No Aplica</option>
                        </select>
                      </td>
                      {/* Prohibiciones */}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.prohibiciones}
                          onChange={(e) => handleChange(index, "prohibiciones", e.target.value)}
                          disabled={estado === "Aprobado"}
                        >
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
                          <option value="no_aplica">No Aplica</option>
                        </select>
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
                  );
                })}
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