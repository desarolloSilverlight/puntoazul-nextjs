import React, { useEffect, useState } from "react";
import Admin from "layouts/Admin";

export default function MiPerfil() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username") || "");
      setEmail(localStorage.getItem("email") || "");
      setPerfil(localStorage.getItem("perfil") || "");
    }
  }, []);

  return (
    <div className="px-4 md:px-10 mx-auto w-full pt-24">
      <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded bg-white">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full flex-grow flex-1">
              <h3 className="font-semibold text-lg text-blueGray-700">Mi perfil</h3>
            </div>
          </div>
        </div>
        <div className="block w-full overflow-x-auto p-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm text-blueGray-400">Usuario</div>
              <div className="text-blueGray-700 font-semibold">{username || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-blueGray-400">Correo</div>
              <div className="text-blueGray-700 font-semibold">{email || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-blueGray-400">Perfil</div>
              <div className="text-blueGray-700 font-semibold">{perfil || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MiPerfil.layout = Admin;
