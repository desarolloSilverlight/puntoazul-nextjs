import React from "react";
import Admin from "layouts/Admin.js";
import CardRenovarFormulariosB from "components/Cards/CardRenovarFormulariosB.js";

export default function RenovarFormulariosB() {
  return (
    <>
      <div className="flex flex-wrap mt-4">
        <div className="w-full mb-12 px-4">
          <CardRenovarFormulariosB />
        </div>
      </div>
    </>
  );
}

RenovarFormulariosB.layout = Admin;
