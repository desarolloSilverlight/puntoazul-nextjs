import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../../utils/config";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { Oval } from 'react-loader-spinner';
import Backdrop from '@mui/material/Backdrop';
import * as XLSX from 'xlsx';
export default function FormularioAfiliado({ color, readonly = false, idInformacionF: propIdInformacionF }) {
  const [isLoading, setIsLoading] = useState(false);
  let idInformacionF = propIdInformacionF || localStorage.getItem("idInformacionF");
  let estadoInformacionF = localStorage.getItem("estadoInformacionF");
  // Solo editable si estado es Guardado o Rechazado Y no está en modo readonly
  const esEditable = !readonly && (estadoInformacionF === "Guardado" || estadoInformacionF === "Rechazado");
  const [productos, setProductos] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toneladasAcumuladasGlobal, setToneladasAcumuladasGlobal] = useState(0);

  // Obtener productos desde el backend al cargar el componente
  // --- Toneladas acumuladas globales ---
  // Definir la función fuera del useEffect para poder reutilizarla
  const fetchToneladasAcumuladas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/informacion-f/getToneladasAcumuladasPlasticos/${idInformacionF}`);
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
        const response = await fetch(`${API_BASE_URL}/informacion-f/getEmpaquesPlasticos/${idInformacionF}`, {
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
    setIsLoading(true);
    // Validar que todos los campos de liquidos, otrosProductos y construccion sean decimales con hasta 10 decimales y reemplazar comas por puntos
    const camposLiquidos = ["PET Agua", "PET Otros", "PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
    const camposOtros = ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "Otros"];
    const decimalRegex = /^\d+(\.\d{1,10})?$/;
    for (let i = 0; i < productos.length; i++) {
      const producto = productos[i];
      // Validación de empresaTitular, nombreProducto y unidades
      if (!producto.empresaTitular || producto.empresaTitular.trim() === "") {
        alert(`El campo 'Empresa Titular' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!producto.nombreProducto || producto.nombreProducto.trim() === "") {
        alert(`El campo 'Nombre Producto' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!producto.unidades || producto.unidades.toString().trim() === "") {
        alert(`El campo 'Unidades Puestas en el mercado' no puede estar vacío en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      // Validación de excepciones y prohibiciones
      const excepcion = producto.excepciones;
      const prohibicion = producto.prohibiciones;
      // Ambos deben tener una opción válida seleccionada
      if (!excepcion || excepcion === "" || excepcion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Excepciones Ley 2232' en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      if (!prohibicion || prohibicion === "" || prohibicion === "Seleccionar...") {
        alert(`Debe seleccionar una opción válida en el campo 'Prohibiciones Ley 2232' en la fila ${i + 1}`);
        setIsLoading(false);
        return;
      }
      // Uno de los dos debe ser 'no_aplica'
      if (excepcion !== "no_aplica" && prohibicion !== "no_aplica") {
        alert(`En la fila ${i + 1}, uno de los campos 'Excepciones Ley 2232' o 'Prohibiciones Ley 2232' debe ser 'No Aplica'.`);
        setIsLoading(false);
        return;
      }
      // liquidos
      for (const campo of camposLiquidos) {
        let valor = producto.liquidos[campo];
        if (valor !== undefined && valor !== "") {
          valor = valor.toString().replace(/,/g, ".");
          if (!decimalRegex.test(valor)) {
            alert(`El campo 'Líquidos.${campo}' en la fila ${i + 1} debe ser un número decimal válido (máx 10 decimales). Valor ingresado: ${producto.liquidos[campo]}`);
            setIsLoading(false);
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
            setIsLoading(false);
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
            setIsLoading(false);
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
      const response = await fetch(`${API_BASE_URL}/informacion-f/crearEmpaquePlastico`, {
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
      console.error("Error al enviar los empaques plásticos:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Excel download functionality
  const descargarPlantilla = () => {
    const tipoReporte = localStorage.getItem("tipoReporte");
    const unidadesEjemplo = tipoReporte === "totalizado" ? "1" : "500";
    
    // Crear datos ejemplo con estructura plana para Excel
    const datosEjemplo = [
      {
        "Empresa titular": "Ejemplo Empresa A",
        "Nombre Producto": "Envase Plástico 1",
        "Liquidos_PET_Agua": "2.5",
        "Liquidos_PET_Otros": "0",
        "Liquidos_PET": "1.8",
        "Liquidos_HDPE": "0",
        "Liquidos_PVC": "0",
        "Liquidos_LDPE": "0.5",
        "Liquidos_PP": "0",
        "Liquidos_PS": "0",
        "Liquidos_Otros": "0",
        "OtrosProductos_PET": "3.2",
        "OtrosProductos_HDPE": "0",
        "OtrosProductos_PVC": "0",
        "OtrosProductos_LDPE": "0",
        "OtrosProductos_PP": "1.1",
        "OtrosProductos_PS": "0",
        "OtrosProductos_Otros": "0",
        "Construccion_PET": "0",
        "Construccion_HDPE": "0",
        "Construccion_PVC": "0",
        "Construccion_LDPE": "0",
        "Construccion_PP": "0",
        "Construccion_PS": "0",
        "Construccion_Otros": "0",
        "Excepciones": "no_aplica",
        "Prohibiciones": "bolsas_pago",
        "Unidades": unidadesEjemplo
      },
      {
        "Empresa titular": "Ejemplo Empresa B",
        "Nombre Producto": "Envase Plástico 2",
        "Liquidos_PET_Agua": "0",
        "Liquidos_PET_Otros": "3.7",
        "Liquidos_PET": "0",
        "Liquidos_HDPE": "2.1",
        "Liquidos_PVC": "0",
        "Liquidos_LDPE": "0",
        "Liquidos_PP": "0",
        "Liquidos_PS": "0",
        "Liquidos_Otros": "0",
        "OtrosProductos_PET": "0",
        "OtrosProductos_HDPE": "4.5",
        "OtrosProductos_PVC": "0",
        "OtrosProductos_LDPE": "0",
        "OtrosProductos_PP": "0",
        "OtrosProductos_PS": "1.8",
        "OtrosProductos_Otros": "0",
        "Construccion_PET": "0",
        "Construccion_HDPE": "0",
        "Construccion_PVC": "0",
        "Construccion_LDPE": "0",
        "Construccion_PP": "0",
        "Construccion_PS": "0",
        "Construccion_Otros": "0",
        "Excepciones": "medicos",
        "Prohibiciones": "no_aplica",
        "Unidades": tipoReporte === "totalizado" ? "1" : "750"
      }
    ];

    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosEjemplo);

    // Agregar instrucciones detalladas
    const instrucciones = [
      [""],
      ["INSTRUCCIONES IMPORTANTES PARA EMPAQUES PLÁSTICOS:"],
      [""],
      ["CAMPOS OBLIGATORIOS:"],
      ["• Empresa titular: No puede estar vacío"],
      ["• Nombre Producto: No puede estar vacío"],
      ["• Unidades: No puede estar vacío"],
      ["• Excepciones: Debe seleccionar una opción válida"],
      ["• Prohibiciones: Debe seleccionar una opción válida"],
      [""],
      ["REGLA ESPECIAL EXCEPCIONES/PROHIBICIONES:"],
      ["• UNO de los dos campos DEBE ser 'no_aplica'"],
      ["• NO pueden ser ambos diferentes a 'no_aplica'"],
      [""],
      ["VALORES NUMÉRICOS:"],
      ["• Todos los pesos en gramos con hasta 10 decimales"],
      ["• Usar punto (.) como separador decimal"],
      ["• Campos vacíos se interpretarán como 0"],
      [""],
      ["OPCIONES VÁLIDAS PARA 'Excepciones':"],
      ["• medicos - Propósitos médicos"],
      ["• quimicos - Químicos con riesgo a la salud humana o al medio ambiente"],
      ["• alimentos - Alimentos, líquidos y bebidas de origen animal, por razones de asepsia o inocuidad"],
      ["• higiene - Fines específicos que por razones de higiene o salud requieren bolsa"],
      ["• asistencia - Uso del plástico en los establecimientos que brindan asistencia médica"],
      ["• impacto - Los plásticos de un solo uso cuyos sustitutos tengan un impacto ambiental y humano mayor"],
      ["• residuos - Empacar o envasar residuos peligrosos"],
      ["• reciclado - Aquellos productos fabricados con 100% de materia reciclada"],
      ["• pitillos - Pitillos adheridos a envases de hasta 300 ml con sistema de retención"],
      ["• no_aplica - No Aplica"],
      [""],
      ["OPCIONES VÁLIDAS PARA 'Prohibiciones':"],
      ["• bolsas_pago - Bolsas de punto de pago (2024)"],
      ["• bolsas_publicidad - Bolsas para publicidad, facturas y lavanderías (2024)"],
      ["• rollos_bolsas - Rollos de bolsas vacías en comercios (2024)"],
      ["• mezcladores_pitillos - Mezcladores y pitillos para bebidas (2024)"],
      ["• soportes_bombas - Soportes plásticos para bombas de inflar (2024)"],
      ["• soportes_copitos - Soportes plásticos de los hisopos flexibles (2024)"],
      ["• envases_liquidos - Envases y bolsas para líquidos no preenvasados (2030)"],
      ["• platos_utensilios - Platos, bandejas, cubiertos, vasos y guantes para comer (2030)"],
      ["• confeti_manteles - Confeti, manteles y serpentinas (2030)"],
      ["• empaques_alimentos - Empaques para comidas no preenvasadas (2030)"],
      ["• laminas_alimentos - Láminas para servir o envolver alimentos (2030)"],
      ["• empaques_frutas - Empaques para frutas, verduras y tubérculos frescos (2030)"],
      ["• adhesivos_etiquetas - Adhesivos, etiquetas o distintivos en vegetales (2030)"],
      ["• no_aplica - No Aplica"]
    ];

    // Agregar nota sobre tipo de reporte
    if (tipoReporte === "totalizado") {
      instrucciones.unshift(["IMPORTANTE: Las unidades deben ser 1 para reportes totalizados"], [""]);
    }

    // Agregar las instrucciones
    XLSX.utils.sheet_add_aoa(worksheet, instrucciones, { origin: 'A4' });

    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Empaques Plásticos");

    // Nombre del archivo según el tipo de reporte
    const nombreArchivo = tipoReporte === "totalizado" 
      ? "plantilla_empaques_plasticos_totalizado.xlsx"
      : "plantilla_empaques_plasticos.xlsx";
    
    XLSX.writeFile(workbook, nombreArchivo);
  };

  // Excel upload functionality
  const cargarDesdeExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('El archivo Excel está vacío.');
          return;
        }

        // Mapeo de columnas con flexibilidad para estructura plana
        const mapearColumnas = (row) => {
          const keys = Object.keys(row);
          return {
            empresaTitular: row[keys.find(k => k.toLowerCase().includes('empresa') || k.toLowerCase().includes('titular'))] || "",
            nombreProducto: row[keys.find(k => k.toLowerCase().includes('nombre') && k.toLowerCase().includes('producto'))] || "",
            // Líquidos (9 campos)
            liquidosPETAgua: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('pet') && k.toLowerCase().includes('agua'))] || "0",
            liquidosPETOtros: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('pet') && k.toLowerCase().includes('otros'))] || "0",
            liquidosPET: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('pet') && !k.toLowerCase().includes('agua') && !k.toLowerCase().includes('otros'))] || "0",
            liquidosHDPE: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('hdpe'))] || "0",
            liquidosPVC: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('pvc'))] || "0",
            liquidosLDPE: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('ldpe'))] || "0",
            liquidosPP: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('pp'))] || "0",
            liquidosPS: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('ps'))] || "0",
            liquidosOtros: row[keys.find(k => k.toLowerCase().includes('liquidos') && k.toLowerCase().includes('otros'))] || "0",
            // Otros Productos (7 campos)
            otrosPET: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('pet'))] || "0",
            otrosHDPE: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('hdpe'))] || "0",
            otrosPVC: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('pvc'))] || "0",
            otrosLDPE: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('ldpe'))] || "0",
            otrosPP: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('pp'))] || "0",
            otrosPS: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('ps'))] || "0",
            otrosOtros: row[keys.find(k => k.toLowerCase().includes('otrosproductos') && k.toLowerCase().includes('otros'))] || "0",
            // Construcción (7 campos)
            construccionPET: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('pet'))] || "0",
            construccionHDPE: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('hdpe'))] || "0",
            construccionPVC: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('pvc'))] || "0",
            construccionLDPE: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('ldpe'))] || "0",
            construccionPP: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('pp'))] || "0",
            construccionPS: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('ps'))] || "0",
            construccionOtros: row[keys.find(k => k.toLowerCase().includes('construccion') && k.toLowerCase().includes('otros'))] || "0",
            // Campos de selección
            excepciones: row[keys.find(k => k.toLowerCase().includes('excepciones'))] || "",
            prohibiciones: row[keys.find(k => k.toLowerCase().includes('prohibiciones'))] || "",
            unidades: row[keys.find(k => k.toLowerCase().includes('unidades'))] || ""
          };
        };

        // Validar y procesar datos
        const productosValidados = [];
        const errores = [];
        const decimalRegex = /^\d+(\.\d{1,10})?$/;
        const tipoReporte = localStorage.getItem("tipoReporte");

        // Opciones válidas
        const opcionesExcepciones = ["medicos", "quimicos", "alimentos", "higiene", "asistencia", "impacto", "residuos", "reciclado", "pitillos", "no_aplica"];
        const opcionesProhibiciones = ["bolsas_pago", "bolsas_publicidad", "rollos_bolsas", "mezcladores_pitillos", "soportes_bombas", "soportes_copitos", "envases_liquidos", "platos_utensilios", "confeti_manteles", "empaques_alimentos", "laminas_alimentos", "empaques_frutas", "adhesivos_etiquetas", "no_aplica"];

        jsonData.forEach((row, index) => {
          const producto = mapearColumnas(row);
          const numeroFila = index + 2;

          // 1. Validar campos obligatorios
          if (!producto.empresaTitular.trim()) {
            errores.push(`Fila ${numeroFila}: 'Empresa titular' es obligatorio`);
          }
          if (!producto.nombreProducto.trim()) {
            errores.push(`Fila ${numeroFila}: 'Nombre Producto' es obligatorio`);
          }
          if (!producto.unidades.toString().trim()) {
            errores.push(`Fila ${numeroFila}: 'Unidades' es obligatorio`);
          }

          // 2. Validar excepciones y prohibiciones
          if (!opcionesExcepciones.includes(producto.excepciones)) {
            errores.push(`Fila ${numeroFila}: 'Excepciones' debe ser una opción válida. Opciones: ${opcionesExcepciones.join(', ')}`);
          }
          if (!opcionesProhibiciones.includes(producto.prohibiciones)) {
            errores.push(`Fila ${numeroFila}: 'Prohibiciones' debe ser una opción válida. Opciones: ${opcionesProhibiciones.join(', ')}`);
          }

          // 3. Validar regla mutua exclusión
          if (producto.excepciones !== "no_aplica" && producto.prohibiciones !== "no_aplica") {
            errores.push(`Fila ${numeroFila}: Uno de 'Excepciones' o 'Prohibiciones' debe ser 'no_aplica'`);
          }

          // 4. Validar campos numéricos
          const camposNumericos = [
            'liquidosPETAgua', 'liquidosPETOtros', 'liquidosPET', 'liquidosHDPE', 'liquidosPVC', 'liquidosLDPE', 'liquidosPP', 'liquidosPS', 'liquidosOtros',
            'otrosPET', 'otrosHDPE', 'otrosPVC', 'otrosLDPE', 'otrosPP', 'otrosPS', 'otrosOtros',
            'construccionPET', 'construccionHDPE', 'construccionPVC', 'construccionLDPE', 'construccionPP', 'construccionPS', 'construccionOtros'
          ];

          for (const campo of camposNumericos) {
            let valor = producto[campo];
            if (valor !== "" && valor !== null && valor !== undefined) {
              valor = valor.toString().replace(/,/g, ".");
              if (!decimalRegex.test(valor)) {
                errores.push(`Fila ${numeroFila}: '${campo}' debe ser un número decimal válido (máx 10 decimales). Valor: ${producto[campo]}`);
              } else {
                producto[campo] = valor;
              }
            } else {
              producto[campo] = "0";
            }
          }

          // 5. Validar unidades según tipoReporte
          if (tipoReporte === "totalizado") {
            if (producto.unidades.toString() !== "1") {
              console.warn(`Fila ${numeroFila}: Las unidades fueron ajustadas a 1 porque el tipo de reporte es totalizado. Valor original: ${producto.unidades}`);
            }
            producto.unidades = "1";
          }

          // Formatear producto para el estado
          const productoFormateado = {
            id: productosValidados.length + 1,
            idInformacionF,
            empresaTitular: producto.empresaTitular,
            nombreProducto: producto.nombreProducto,
            liquidos: {
              "PET Agua": producto.liquidosPETAgua,
              "PET Otros": producto.liquidosPETOtros,
              "PET": producto.liquidosPET,
              "HDPE": producto.liquidosHDPE,
              "PVC": producto.liquidosPVC,
              "LDPE": producto.liquidosLDPE,
              "PP": producto.liquidosPP,
              "PS": producto.liquidosPS,
              "Otros": producto.liquidosOtros
            },
            otrosProductos: {
              "PET": producto.otrosPET,
              "HDPE": producto.otrosHDPE,
              "PVC": producto.otrosPVC,
              "LDPE": producto.otrosLDPE,
              "PP": producto.otrosPP,
              "PS": producto.otrosPS,
              "Otros": producto.otrosOtros
            },
            construccion: {
              "PET": producto.construccionPET,
              "HDPE": producto.construccionHDPE,
              "PVC": producto.construccionPVC,
              "LDPE": producto.construccionLDPE,
              "PP": producto.construccionPP,
              "PS": producto.construccionPS,
              "Otros": producto.construccionOtros
            },
            excepciones: producto.excepciones,
            prohibiciones: producto.prohibiciones,
            unidades: producto.unidades.toString()
          };

          productosValidados.push(productoFormateado);
        });

        if (errores.length > 0) {
          alert(`Se encontraron los siguientes errores:\n\n${errores.join('\n')}`);
          return;
        }

        // Actualizar estado con productos validados
        setProductos(productosValidados);
        
        // Mensaje informativo según el tipo de reporte
        let mensaje = `Se cargaron exitosamente ${productosValidados.length} productos desde Excel.`;
        if (tipoReporte === "totalizado") {
          mensaje += "\n\nNota: Las unidades fueron ajustadas automáticamente a 1 porque el tipo de reporte es totalizado.";
        }
        alert(mensaje);

      } catch (error) {
        console.error('Error al procesar archivo Excel:', error);
        alert('Error al procesar el archivo Excel. Verifique que el formato sea correcto.');
      }
    };

    reader.readAsArrayBuffer(file);
    event.target.value = '';
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
          Toneladas acumuladas (Plasticos): {Number(toneladasAcumuladasGlobal).toFixed(10)}
        </div>
        {!readonly && (
          <div className="flex justify-between mt-3 gap-2">
            <button 
              type="button"
              className="bg-lightBlue-600 text-white px-4 py-2 rounded hover:bg-lightBlue-700" 
              onClick={agregarProducto}
            >
              Agregar Producto
            </button>
            
            <label className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded cursor-pointer inline-flex items-center">
              Cargar Excel
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={cargarDesdeExcel}
                className="hidden"
              />
            </label>
            <button 
                type="button"
                className="bg-lightBlue-600 hover:bg-lightBlue-700 text-white px-4 py-2 rounded"
                onClick={descargarPlantilla}
              >
                Descargar Plantilla Excel
              </button>
          </div>
        )}
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
                  {!readonly && <th rowSpan="2" className="min-w-[160px] px-3 py-0.5 text-xs leading-snug whitespace-normal text-center font-semibold bg-gray-100 border border-gray-300 rounded-sm">Acciones</th>}
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
                      {!readonly && (
                        <td>
                          <button 
                            className="bg-red-500 text-white px-4 py-1 rounded" 
                            onClick={e => { e.preventDefault(); setProductos(productos.filter((_, i) => i !== index)); }}
                            disabled={!esEditable}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
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