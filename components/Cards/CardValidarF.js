import React, { useState, useEffect } from "react";

export default function CardValidarF({ color }) {
  const [clientes, setClientes] = useState([]); // Clientes con formulario F pendiente
  const [selectedCliente, setSelectedCliente] = useState(null); // Cliente seleccionado
  const [activeTab, setActiveTab] = useState("empaques"); // Pestaña activa
  const [empaques, setEmpaques] = useState([]); // Resumen de empaques
  const [plasticos, setPlasticos] = useState([]); // Resumen de plásticos

  // Obtener clientes con formulario F pendiente
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("https://nestbackend.fidare.com/informacion-f/getClientesPendientes", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Clientes obtenidos:", data); // Verifica los clientes obtenidos
        setClientes(data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }
    };

    fetchClientes();
  }, []);

  // Manejar selección de cliente
  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);
    console.log("Cliente seleccionado:", cliente); // Verifica el cliente seleccionado

    try {
      // Obtener resumen de empaques
      const empaquesResponse = await fetch(`https://nestbackend.fidare.com/informacion-f/getEmpaquesResumen/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!empaquesResponse.ok) {
        throw new Error(`Error ${empaquesResponse.status}: ${empaquesResponse.statusText}`);
      }

      const empaquesData = await empaquesResponse.json();
      setEmpaques(empaquesData);

      // Obtener resumen de plásticos
      const plasticosResponse = await fetch(`https://nestbackend.fidare.com/informacion-f/getPlasticosResumen/${cliente.idInformacionF}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!plasticosResponse.ok) {
        throw new Error(`Error ${plasticosResponse.status}: ${plasticosResponse.statusText}`);
      }

      const plasticosData = await plasticosResponse.json();
      setPlasticos(plasticosData);
    } catch (error) {
      console.error("Error al obtener los datos del cliente:", error);
    }
  };

  // Manejar acción de firmar
  const handleFirmar = async () => {
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Aprobado" }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("El formulario ha sido aprobado.");
      setSelectedCliente(null); // Volver a la lista de clientes
    } catch (error) {
      console.error("Error al aprobar el formulario:", error);
      alert("Hubo un error al aprobar el formulario.");
    }
  };

  // Manejar acción de rechazar
  const handleRechazar = async () => {
    try {
      const response = await fetch(`https://nestbackend.fidare.com/informacion-f/updateEstado/${selectedCliente.idInformacionF}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "Rechazado" }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      alert("El formulario ha sido rechazado.");
      setSelectedCliente(null); // Volver a la lista de clientes
    } catch (error) {
      console.error("Error al rechazar el formulario:", error);
      alert("Hubo un error al rechazar el formulario.");
    }
  };

  return (
    <div
      className={`relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded ${
        color === "light" ? "bg-white" : "bg-blueGray-700 text-white"
      }`}
    >
      {!selectedCliente ? (
        <>
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <h3 className="text-lg font-semibold flex items-center">Clientes con Formulario F Pendiente</h3>
        </div>
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Razón Social</th>
                <th className="p-2">NIT</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.idInformacionF} className="border-t text-center">
                  <td className="p-2">{cliente.nombre}</td>
                  <td className="p-2">{cliente.nit}</td>
                  <td className="p-2">
                    <button
                      className="bg-lightBlue-600 text-white font-bold text-xs px-4 py-2 rounded shadow hover:shadow-md"
                      onClick={() => handleSelectCliente(cliente)}
                    >
                      Validar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4">
            <button
              className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg ${activeTab === "empaques" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
              onClick={() => setActiveTab("empaques")}
            >
              Empaques
            </button>
            <button
              className={`p-3 px-6 text-lg font-semibold transition-all duration-300 rounded-t-lg ${activeTab === "plasticos" ? "bg-white border-b-4 border-blue-500 text-blue-600 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-white hover:text-blue-500"}`}
              onClick={() => setActiveTab("plasticos")}
            >
              Plásticos
            </button>
          </div>

          {activeTab === "empaques" ? (
            <div>
              <h4 className="text-md font-semibold">Resumen de Empaques</h4>
              <table className="w-full mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Razón Social</th>
                    <th className="p-2">Primarios</th>
                    <th className="p-2">Secundarios</th>
                    <th className="p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {empaques.map((empaque) => (
                    <tr key={empaque.id} className="border-t">
                      <td className="p-2">{empaque.razonSocial}</td>
                      <td className="p-2">{empaque.primarios}</td>
                      <td className="p-2">{empaque.secundarios}</td>
                      <td className="p-2">{empaque.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <h4 className="text-md font-semibold">Resumen de Plásticos</h4>
              <table className="w-full mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Razón Social</th>
                    <th className="p-2">PET</th>
                    <th className="p-2">HDPE</th>
                    <th className="p-2">PVC</th>
                    <th className="p-2">Otros</th>
                  </tr>
                </thead>
                <tbody>
                  {plasticos.map((plastico) => (
                    <tr key={plastico.id} className="border-t">
                      <td className="p-2">{plastico.razonSocial}</td>
                      <td className="p-2">{plastico.PET}</td>
                      <td className="p-2">{plastico.HDPE}</td>
                      <td className="p-2">{plastico.PVC}</td>
                      <td className="p-2">{plastico.otros}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleFirmar}>
              Firmar
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={handleRechazar}>
              Rechazar
            </button>
            <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={() => setSelectedCliente(null)}>
              Atrás
            </button>
          </div>
        </>
      )}
    </div>
  );
}