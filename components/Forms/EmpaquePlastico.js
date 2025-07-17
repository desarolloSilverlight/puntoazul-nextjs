import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
export default function FormularioAfiliado({ color }) {
  let idInformacionF = localStorage.getItem("idInformacionF");
  let estadoInformacionF = localStorage.getItem("estadoInformacionF");
  // Solo editable si estado es Guardado o Rechazado
  const esEditable = estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado";
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toneladasAcumuladasGlobal, setToneladasAcumuladasGlobal] = useState(0);

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
          pet: producto.pet || "",
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

    // Obtener toneladas acumuladas globales (plástico + primario + secundario)
    const fetchToneladasAcumuladas = async () => {
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-f/getToneladasAcumuladas/${idInformacionF}`);
        if (!response.ok) throw new Error("No se pudo obtener toneladas acumuladas");
        const data = await response.json();
        setToneladasAcumuladasGlobal(Number(data.toneladas) || 0);
      } catch {
        setToneladasAcumuladasGlobal(0);
      }
    };
    if (idInformacionF) {
      fetchProductos();
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
        liquidos: {
          "PET Agua": 0,
          "PET Otros": 0,
          "PET": 0,
          HDPE: 0,
          PVC: 0,
          LDPE: 0,
          PP: 0,
          PS: 0,
          Otros: 0
        },
        otrosProductos: {
          PET: 0,
          HDPE: 0,
          PVC: 0,
          LDPE: 0,
          PP: 0,
          PS: 0,
          Otros: 0
        },
        construccion: {
          PET: 0,
          HDPE: 0,
          PVC: 0,
          LDPE: 0,
          PP: 0,
          PS: 0,
          Otros: 0
        },
        excepciones: "",
        prohibiciones: "",
        unidades: localStorage.getItem("tipoReporte") === "totalizado" ? "1" : ""
      },
    ]);
  };

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...productos];
    const sanitizedValue = value.replace(",", ".");

    if (field.startsWith("liquidos.")) {
      const subField = field.split(".")[1];
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
    } else if (field === "unidades") {
      // Si tipoReporte es totalizado, forzar a 1
      if (localStorage.getItem("tipoReporte") === "totalizado") {
        nuevosProductos[index].unidades = "1";
      } else {
        nuevosProductos[index].unidades = sanitizedValue;
      }
    } else {
      nuevosProductos[index][field] = sanitizedValue;
    }

    setProductos(nuevosProductos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validar que todos los campos de liquidos, otrosProductos y construccion sean decimales con hasta 10 decimales y reemplazar comas por puntos
    const camposLiquidos = ["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
    const camposOtros = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
    const decimalRegex = /^\d+(\.\d{1,10})?$/;
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // Validación de excepciones y prohibiciones
      const excepcion = producto.excepciones;
      const prohibicion = producto.prohibiciones;
      // Ambos deben tener una opción válida seleccionada
      if (!excepcion || excepcion === "" || excepcion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Excepciones Ley 2232' en la fila ${i + 1}`);
        return;
      }
      if (!prohibicion || prohibicion === "" || prohibicion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Prohibiciones Ley 2232' en la fila ${i + 1}`);
        return;
      }
      // Uno de los dos debe ser 'no_aplica'
      if (excepcion !== "no_aplica" && prohibicion !== "no_aplica") {
        alert(`En la fila ${i + 1}, uno de los campos 'Excepciones Ley 2232' o 'Prohibiciones Ley 2232' debe ser 'No Aplica'.`);
        return;
      }
      // liquidos
      for (const campo of camposLiquidos) {
        let valor = producto.liquidos[campo];
        if (valor !== undefined && valor !== "") {
          valor = valor.toString().replace(/,/g, ".");
          if (!decimalRegex.test(valor)) {
            alert(`El campo 'Líquidos.${campo}' en la fila ${i + 1} debe ser un número decimal válido (máx 10 decimales). Valor ingresado: ${producto.liquidos[campo]}`);
            return;
          }
          // Actualizar el valor en productos para asegurar que se envía con punto
          productos[i].liquidos[campo] = valor;
        }
      }
      // otrosProductos
      for (const campo of camposOtros) {
        let valor = producto.otrosProductos[campo];
        if (valor !== undefined && valor !== "") {
          valor = valor.toString().replace(/,/g, ".");
          if (!decimalRegex.test(valor)) {
            alert(`El campo 'Otros Productos.${campo}' en la fila ${i + 1} debe ser un número decimal válido (máx 10 decimales). Valor ingresado: ${producto.otrosProductos[campo]}`);
            return;
          }
          productos[i].otrosProductos[campo] = valor;
        }
      }
      // construccion
      for (const campo of camposOtros) {
        let valor = producto.construccion[campo];
        if (valor !== undefined && valor !== "") {
          valor = valor.toString().replace(/,/g, ".");
          if (!decimalRegex.test(valor)) {
            alert(`El campo 'Construcción.${campo}' en la fila ${i + 1} debe ser un número decimal válido (máx 10 decimales). Valor ingresado: ${producto.construccion[campo]}`);
            return;
          }
          productos[i].construccion[campo] = valor;
        }
      }
    }
    // Serializar los campos de plásticos solo una vez antes de enviar
    const productosSerializados = productos.map((producto) => ({
      ...producto,
      liquidos: typeof producto.liquidos === 'string' ? JSON.parse(producto.liquidos) : producto.liquidos,
      otrosProductos: typeof producto.otrosProductos === 'string' ? JSON.parse(producto.otrosProductos) : producto.otrosProductos,
      construccion: typeof producto.construccion === 'string' ? JSON.parse(producto.construccion) : producto.construccion
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
    {  type: "PET", unit: "Gramos", description: "(Polietilentereftalato) Es un plástico transparente y ligero, común en botellas de agua y bebidas. Se puede reconocer porque es claro, rígido y suele llevar el número 1 dentro del símbolo de reciclaje." },
    {  type: "HDPE", unit: "Gramos", description: "(Polietileno de alta densidad) Es más opaco y resistente, común en envases de detergentes y productos de limpieza. Se puede identificar por su textura rígida y generalmente lleva el número 2 en el símbolo de reciclaje." },
    {  type: "PVC", unit: "Gramos", description: "(Policloruro de vinilo) Es un plástico rígido o flexible, usado en tuberías y algunos envases de alimentos. Suele ser más difícil de doblar y lleva el número 3 en el símbolo de reciclaje." },
    {  type: "LDPE", unit: "Gramos", description: "(Polietileno de baja densidad) es un plástico flexible y ligero, común en bolsas de plástico, envolturas y algunos tipos de envases. Se puede reconocer por su textura suave y flexible, y generalmente lleva el número 4 en el símbolo de reciclaje." },
    {  type: "PP", unit: "Gramos", description: "(Polipropileno) es un plástico resistente al calor, común en tapas de botellas, envases de alimentos y productos médicos. Se puede reconocer porque es rígido pero ligero, y generalmente lleva el número 5 en el símbolo de reciclaje." },
    {  type: "PS", unit: "Gramos", description: "(Poliestireno) es un plástico ligero y frágil, utilizado en vasos desechables, envases de comida y materiales de embalaje. Se puede reconocer por su textura rígida o espumosa y suele llevar el número 6 en el símbolo de reciclaje." },
    {  type: "OTROS", unit: "Gramos", description: "(Otros) se refiere a plásticos que no entran en las categorías comunes (1 a 6), como mezclas de diferentes tipos de plásticos o plásticos menos frecuentes. Se pueden reconocer por llevar el número 7 en el símbolo de reciclaje y suelen ser más difíciles de reciclar." }
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
        <div className="mt-2 mb-2 text-blue-700 font-bold text-lg">
          Toneladas acumuladas (global): {toneladasAcumuladasGlobal}
        </div>
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
          Todos los pesos de la tabla deben estar en gramos y sin separador de miles.
        </div>
        <form onSubmit={handleSubmit}>
          <div className="w-full overflow-x-auto p-4">
            <table className="w-full table-auto border-separate border-spacing-x-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">No.</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Empresa Titular</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Nombre Producto</th>
                  <th colSpan="9" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Líquidos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Otros Productos Plásticos</th>
                  <th colSpan="7" className="text-center min-w-[160px] px-3 py-0.5 text-xs leading-snug font-semibold bg-gray-100 border border-gray-300 rounded-sm">Plásticos de Construcción</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Excepciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Prohibiciones Ley 2232</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Unidades Puestas en el mercado</th>
                  <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Acciones</th>
                </tr>
                <tr className="bg-gray-200">
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de botellas PET de agua (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Peso de botellas PET de otro tipo de bebidas (g)</th>
                  <th className="min-w-[120px] px-2 py-0.5 text-xs text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">PET para otros líquidos (g)</th>
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
                  // Usar siempre el valor local (mayúsculas) si existe, si no, fallback al backend
                  const liquidos = typeof producto.liquidos === "string" ? JSON.parse(producto.liquidos || "{}") : (producto.liquidos || {});
                  const otrosProductos = typeof producto.otrosProductos === "string" ? JSON.parse(producto.otrosProductos || "{}") : (producto.otrosProductos || {});
                  const construccion = typeof producto.construccion === "string" ? JSON.parse(producto.construccion || "{}") : (producto.construccion || {});

                  return (
                    <tr key={producto.idEmpaque || index} className="border-t text-center">
                      <td className="p-2 border border-gray-300">{index + 1}</td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "empresaTitular", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.empresaTitular !== undefined ? producto.empresaTitular : (producto.empresa || "")}
                          </div>
                        ) : (
                          <div className="p-1">{producto.empresaTitular !== undefined ? producto.empresaTitular : (producto.empresa || "")}</div>
                        )}
                      </td>
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        {esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "nombreProducto", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.nombreProducto !== undefined ? producto.nombreProducto : (producto.nombre_producto || "")}
                          </div>
                        ) : (
                          <div className="p-1">{producto.nombreProducto !== undefined ? producto.nombreProducto : (producto.nombre_producto || "")}</div>
                        )}
                      </td>
                      {/* Líquidos */}
                      {["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`liquidos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `liquidos.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {liquidos[key] !== undefined ? liquidos[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{liquidos[key] !== undefined ? liquidos[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Otros Productos */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`otrosProductos-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `otrosProductos.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {otrosProductos[key] !== undefined ? otrosProductos[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{otrosProductos[key] !== undefined ? otrosProductos[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      {/* Construcción */}
                      {["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"].map((key) => (
                        <td key={`construccion-${key}`} className="min-w-[100px] p-1 border border-gray-300">
                          {esEditable ? (
                            <div
                              contentEditable
                              onBlur={e => handleChange(index, `construccion.${key}`, e.target.textContent || "")}
                              className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                            >
                              {construccion[key] !== undefined ? construccion[key] : 0}
                            </div>
                          ) : (
                            <div className="p-1">{construccion[key] !== undefined ? construccion[key] : 0}</div>
                          )}
                        </td>
                      ))}
                      <td className="min-w-[100px] p-1 border border-gray-300">
                        <select
                          className="border p-1 w-full"
                          value={producto.excepciones}
                          onChange={e => handleChange(index, "excepciones", e.target.value)}
                          disabled={!esEditable}
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
                          onChange={e => handleChange(index, "prohibiciones", e.target.value)}
                          disabled={!esEditable}
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
                        {localStorage.getItem("tipoReporte") === "totalizado" ? (
                          <div className="w-fit max-w-full p-1 border border-gray-300 bg-gray-100 text-center">1</div>
                        ) : esEditable ? (
                          <div
                            contentEditable
                            onBlur={e => handleChange(index, "unidades", e.target.textContent || "")}
                            className="w-fit max-w-full p-1 border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none"
                          >
                            {producto.unidades}
                          </div>
                        ) : (
                          <div className="p-1">{producto.unidades}</div>
                        )}
                      </td>
                      <td>
                        <button 
                          className="bg-red-500 text-white px-4 py-1 rounded" 
                          onClick={e => { e.preventDefault(); setProductos(productos.filter((_, i) => i !== index)); }}
                          disabled={!esEditable}
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
            disabled={!esEditable}
          >
            Guardar
          </button>
        </form>
      </div>
      {/* Modal con react-modal y estilos de Informacion.js */}
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
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="border px-4 py-2">Tipo</th>
                <th className="border px-4 py-2">Unidad</th>
                <th className="border px-4 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {plasticsData.map((plastic) => (
                <tr key={plastic.code} className="border">
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
      </Modal>
    </div>
  );
}

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};