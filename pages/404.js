import React, { Component } from "react";
import Router from "next/router";

export default class Error404 extends Component {
  componentDidMount = () => {
    // Solo redirigir si es realmente una página 404, no rutas válidas
    const validAuthRoutes = ["/auth/login", "/auth/register", "/auth/reset-password", "/auth/primer-acceso"];
    const currentPath = window.location.pathname;
    
    // Si no es una ruta de auth válida, redirigir a login
    if (!validAuthRoutes.includes(currentPath)) {
      Router.push("/auth/login");
    }
  };

  render() {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
          <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
          <button 
            onClick={() => Router.push("/auth/login")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }
}
