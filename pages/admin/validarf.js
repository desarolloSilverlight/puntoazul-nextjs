import React from "react";

// components

import CardTable from "components/Cards/CardValidarF.js";

// layout for page

import Admin from "layouts/Admin.js";

export default function Tables() {
  return (
    <>
        <div className="flex flex-wrap mt-4">
            <div className="w-full mb-12 px-4">
            <CardTable color="light" />
            </div>
        </div>
    </>
  );
}

Tables.layout = Admin;