import React, { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
// layout for page

import Auth from "layouts/Auth.js";
export default function Login() {
  const [username, setIdentificacion] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Reiniciar error
  
    try {
      // Realizar la solicitud de inicio de sesión
      const loginResponse = await fetch("https://nestbackend.fidare.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 🔥 Permitir cookies en la petición
        body: JSON.stringify({ username, password }),
      });
  
      const loginData = await loginResponse.json();
      console.log(loginData);
  
      if (!loginResponse.ok) {
        throw new Error(loginData.message || "Error al iniciar sesión");
      }
      const userName = loginData.id;
      const perfil = loginData.perfil;
      const idUsuario = loginData.idUsuario;
      localStorage.setItem("perfil", perfil); 
      localStorage.setItem("username", userName); 
      localStorage.setItem("id", idUsuario); 
      router.push({
        pathname: "/admin/dashboard",
        query: { username: userName },
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container mx-auto px-4 h-full">
      <div className="flex content-center items-center justify-center h-full">
        <div className="w-full lg:w-4/12 px-4">
          <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200 border-0">
            <div className="rounded-t mb-0 px-6 py-6">
              <div className="text-center mb-3">
                <h6 className="text-blueGray-500 text-sm font-bold">
                  Bienvenido
                </h6>
              </div>
              <div className="flex justify-center items-center">
                <Image
                  src="/Logo_PuntoAzul_Horizontal.png"
                  alt="Logo Punto Azul"
                  width={250}
                  height={125}
                />
              </div>
              <hr className="mt-6 border-b-1 border-blueGray-300" />
            </div>
            <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <form onSubmit={handleLogin}>
                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Correo Electronico
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setIdentificacion(e.target.value)}
                    className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    required
                  />
                </div>

                <div className="relative w-full mb-3">
                  <label className="block uppercase text-blueGray-600 text-xs font-bold mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    required
                  />
                </div>

                <div className="text-center mt-6">
                  <button
                    type="submit"
                    className="bg-blueGray-800 text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none w-full ease-linear transition-all duration-150"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
Login.layout = Auth;