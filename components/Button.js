import React from "react";

const Button = ({ children, variant = "primary", onClick }) => {
  const baseStyle =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md";

  const variantStyles = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400 shadow-blue-300",
    secondary:
      "bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-400 shadow-gray-300",
    danger:
      "bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 shadow-red-300",
  };

  // Si el variant no es válido, se usa primary por defecto
  const appliedStyle = variantStyles[variant] || variantStyles["primary"];

  return (
    <button className={`${baseStyle} ${appliedStyle}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
