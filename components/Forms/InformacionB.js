import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function FormularioAfiliado({ color }) {
  const [formData, setFormData] = useState({
    nombre: "",
    nit: "",
    direccion: "",
    ciudad: "",
    telefono: "",
    representante: "",
    telefonoRe: "",
    contactoRe: "",
    cargo: "",
    correoRe: "",
    ano: new Date().getFullYear().toString(), // Inicializar con el año actual
    anoReporte: (new Date().getFullYear() - 1).toString(), // Inicializar con el año anterior
    titulares: "",
    origen: "",
    correoFacturacion: "",
  });
  const [estado, setEstado] = useState(""); // Estado del formulario
  const [isDisabled, setIsDisabled] = useState(false); // Controlar si los campos están bloqueados
  const [isSaveDisabled, setIsSaveDisabled] = useState(false); // Controlar si el botón "Guardar" está deshabilitado
  const [isOpen, setIsOpen] = useState(false); // Estado para el modal

  let timeoutId; // Variable para almacenar el temporizador

  const handleAnoReporteChange = (e) => {
    const { value } = e.target;

    // Actualizar el estado del formulario inmediatamente para reflejar el input
    setFormData((prev) => ({ ...prev, anoReporte: value }));

    // Limpiar el temporizador anterior si el usuario sigue escribiendo
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Configurar un nuevo temporizador
    timeoutId = setTimeout(() => {
      // Validar si el valor tiene 4 dígitos
      if (value.length === 4) {
        const anoReporte = parseInt(value, 10);
        const ano = parseInt(formData.ano, 10);

        if (!isNaN(anoReporte) && !isNaN(ano)) {
          if (ano != anoReporte-1) {
            alert("El año de reporte solo puede ser del año anterior.");
            setIsSaveDisabled(true); // Deshabilitar el botón "Guardar"
          } else {
            setIsSaveDisabled(false); // Habilitar el botón "Guardar"
          }
        }
      }
    }, 1000); // Esperar 500 ms después de que el usuario deje de escribir
  };

  // Obtener datos del backend al cargar el componente
  useEffect(() => {
    const fetchData = async () => {
      const idUsuario = localStorage.getItem("id"); // Obtener el idUsuario desde localStorage
      try {
        const response = await fetch(`https://nestbackend.fidare.com/informacion-b/getByIdUsuario/${idUsuario}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("No se encontraron datos para este usuario.");
            return; // Si no hay datos, no hacemos nada
          }
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos obtenidos:", data);
        localStorage.setItem("idInformacionB", data.idInformacionB); // Guardar id en localStorage
        localStorage.setItem("estadoInformacionB", data.estado); // Guardar id en localStorage
        // Llenar los campos del formulario con los datos obtenidos
        setFormData({
          nombre: data.nombre || "",
          nit: data.nit || "",
          direccion: data.direccion || "",
          ciudad: data.ciudad || "",
          telefono: data.telefono || "",
          representante: data.representante || "",
          telefonoRe: data.telefonoRe || "",
          contactoRe: data.contactoRe || "",
          cargoRe: data.cargoRe || "",
          correoRe: data.correoRe || "",
          ano: data.ano || "",
          anoReporte: data.anoReporte || "",
          titulares: data.titulares || "",
          origen: data.origen || "",
          correoFacturacion: data.correoFacturacion || "",
        });


        // Manejar el estado del formulario según el valor de "estado"
        setEstado(data.estado);
        if (data.estado === "Pendiente") {
          setIsDisabled(true); // Bloquear los campos
        } else if (data.estado === "Aprobado") {
          alert("Felicidades, tu formulario ha sido aprobado.");
          setIsDisabled(true)
        } else if (data.estado === "Rechazado") {
          alert("Por favor verifica tu información, tu formulario ha sido rechazado.");
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const idUsuario = localStorage.getItem("id"); // Obtener el idUsuario desde localStorage

    const updatedFormData = {
      ...formData,
      idUsuario,
    };

    // Mostrar un alert de confirmación
    const isConfirmed = window.confirm("¿Estás seguro de que los datos ingresados son correctos?");
    if (!isConfirmed) {
      return; // Si el usuario cancela, no se ejecuta la lógica de guardar
    }
    console.log("Datos del formulario a enviar:", updatedFormData);

    try {
      // Verificar si el usuario ya tiene datos guardados
      const checkResponse = await fetch(`https://nestbackend.fidare.com/informacion-b/getByIdUsuario/${idUsuario}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (checkResponse.ok) {
        // Si ya existen datos, actualizarlos
        const response = await fetch("https://nestbackend.fidare.com/informacion-b/updateInfo", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Formulario actualizado:", result);
        alert("Formulario actualizado correctamente.");
      } else if (checkResponse.status === 404) {
        // Si no existen datos, crearlos
        const response = await fetch("https://nestbackend.fidare.com/informacion-b/createInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedFormData),
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Formulario creado:", result);
        alert("Formulario creado correctamente.");
        localStorage.setItem("idInformacionB", result.data.idInformacionB); // Guardar id en localStorage
      } else {
        throw new Error(`Error ${checkResponse.status}: ${checkResponse.statusText}`);
      }
    } catch (error) {
      console.error("Error al enviar el formulario:", error);
      alert("Hubo un error al enviar el formulario.");
    }
  };

  return (
    <div
      className={
        "relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded p-6 " +
        (color === "light" ? "bg-white" : "bg-blueGray-700 text-white")
      }
    >
      {/* Formulario */}
      <form onSubmit={handleSubmit}>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center">
            Información sobre el Afiliado&nbsp;
            <i
              className="fa-solid fa-circle-info text-blue-500 cursor-pointer"
              onClick={() => setIsOpen(true)}
            ></i>
          </h3>

          {/* Primera fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              name="nombre"
              className="border p-2 w-full"
              type="text"
              placeholder="Nombre o razón social"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={isDisabled}
              required
            />
            <input
              name="nit"
              className="border p-2 w-full"
              type="text"
              placeholder="NIT"
              value={formData.nit}
              onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
              disabled={isDisabled}
              required
            />
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              name="direccion"
              className="border p-2 w-full"
              type="text"
              placeholder="Dirección"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="ciudad"
              className="border p-2 w-full"
              type="text"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="telefono"
              className="border p-2 w-full"
              type="text"
              placeholder="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Tercera fila */}
          <div className="grid grid-cols-5 gap-4 mb-4">
            <input
              name="representante"
              className="border p-2 w-full"
              type="text"
              placeholder="Representante Legal"
              value={formData.representante}
              onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="telefonoRe"
              className="border p-2 w-full"
              type="text"
              placeholder="Teléfono Representante"
              value={formData.telefonoRe}
              onChange={(e) => setFormData({ ...formData, telefonoRe: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="contactoRe"
              className="border p-2 w-full"
              type="text"
              placeholder="Persona de contacto"
              value={formData.contactoRe}
              onChange={(e) => setFormData({ ...formData, contactoRe: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="cargoRe"
              className="border p-2 w-full"
              type="text"
              placeholder="Cargo"
              value={formData.cargoRe}
              onChange={(e) => setFormData({ ...formData, cargoRe: e.target.value })}
              disabled={isDisabled}
            />
            <input
              name="correoRe"
              className="border p-2 w-full"
              type="email"
              placeholder="Correo"
              value={formData.correoRe}
              onChange={(e) => setFormData({ ...formData, correoRe: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Cuarta fila */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <input
              name="ano"
              className="border p-2 w-full"
              type="number"
              placeholder="Año"
              value={formData.ano}
              disabled={true} // Siempre deshabilitado
            />
            <input
              name="anoReporte"
              className="border p-2 w-full"
              type="number"
              placeholder="Año reporte"
              value={formData.anoReporte}
              disabled={true} // Siempre deshabilitado
            />
            <input
              name="titulares"
              className="border p-2 w-full"
              type="number"
              placeholder="Titulares Representados"
              value={formData.titulares}
              onChange={(e) => setFormData({ ...formData, titulares: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Quinta fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select
              name="origen"
              className="border p-2 w-full"
              value={formData.origen}
              onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
              disabled={isDisabled}
            >
              <option value="">Seleccione ...</option>
              <option value="Nacional">Nacional</option>
              <option value="Multinacional">Multinacional</option>
            </select>
            <input
              name="correoFacturacion"
              className="border p-2 w-full"
              type="email"
              placeholder="Correo de facturación"
              value={formData.correoFacturacion}
              onChange={(e) => setFormData({ ...formData, correoFacturacion: e.target.value })}
              disabled={isDisabled}
            />
          </div>

          {/* Sexta fila */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            className="bg-lightBlue-600 text-white px-4 py-2 rounded mt-3"
            disabled={isDisabled || isSaveDisabled}
          >
            Guardar
          </button>
        </div>
      </form>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 ">
          <div className="bg-white p-5 rounded-lg shadow-lg max-h-260-px overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Instructivo de la sección</h2>
            {/* Tabla con información */}
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
                    ["1", "Nombre o Razón Social", "Texto", "Razón social/Nombre de la persona natural o jurídica participante del plan colectivo de posconsumo de medicamentos de uso humano que presenta la información. Asociado a la Corporación Punto Azul."],
                    ["2", "NIT", "Número", "Número de Identificación Tributaria de la persona natural o jurídica."],
                    ["3", "Dirección", "Texto", "Dirección de recepción de notificaciones realizadas en los trámites ante la Autoridad Nacional de Licencias Ambientales - ANLA y la Corporación Punto Azul - CPA."],
                    ["4", "Ciudad", "Texto", "Ciudad correspondiente a la dirección de notificación."],
                    ["5", "Telefono", "Número", "Teléfono de contacto de la persona encargada del trámite por parte de la empresa."],
                    ["6", "Representante Legal", "Texto", "Nombre del representante legal de la empresa."],
                    ["7", "Telefono", "Número", "Teléfono de contacto con el Representante Legal para notificaciones correspondientes."],
                    ["8", "Persona de Contacto", "Texto", "Nombre de contacto de la persona por parte de la empresa, quien está a cargo de los trámites, temas o actividades competentes ante la CPA."],
                    ["9", "Cargo", "Texto", "Cargo de la persona de contacto por parte de la empresa a quien la CPA comunica la gestión, reuniones y otras actividades en el marco del objeto social de la CPA."],
                    ["10", "Correo electrónico", "Texto", "Correo electrónico de la persona de contacto de la empresa."],
                    ["11", "Año", "Número", "Fecha de presentación del Formato del Literal B. (año actual)"],
                    ["12", "Año reporte de productos", "Número", "Año para el cual se reporta la información respecto a registros sanitarios y productos comercializados. Año inmediatamente anterior al vigente."],
                    ["13", "Titulares representados", "Número", "Cantidad de titulares de registros sanitarios representados en el plan por la empresa asociada a la Corporación, adicional a esta última."],
                    ["14", "Capital de origen (Nacional o Multinacional)", "Texto", "Diligencie si el capital de origen de su compañía es Nacional o Multinacional."],
                    ["15", "Correo de Facturación", "Texto", "Diligencie el correo de facturación de su compañía."],
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

FormularioAfiliado.propTypes = {
  color: PropTypes.string,
};
