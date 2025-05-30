import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";

export default function HeaderStats() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    fade: true,
    cssEase: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  };

  const images = [
    "/img/carruselF/img1.PNG",
    "/img/carruselF/img2.png",
    "/img/carruselF/img3.png",
    "/img/carruselF/img4.png"
  ];

  const carouselHeight = '390px'; // Puedes ajustar esto

  return (
    <div className="relative w-full min-h-[390px] overflow-hidden">
      {/* Carrusel principal */}
      <Slider {...settings} className="w-full h-full">
        {images.map((img, index) => (
          <div key={index} className="w-full h-full">
            <Image
              src={img}
              alt={`Background ${index + 1}`}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              width={1920} // mejor resolución si es para pantalla completa
              height={390}
            />
          </div>
        ))}
      </Slider>

      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-black/30 z-0" />

      {/* Contenido encima del carrusel */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 text-white">
        <div className="flex justify-between items-start">
          <div className="space-x-6">
            <a href="#" className="hover:underline">Information</a>
            <a href="#" className="hover:underline">Productos</a>
          </div>
          <span className="font-medium">ADMINISTRATOR</span>
        </div>

        <div>{/* Aquí puedes meter tus tarjetas si las usas en el futuro */}</div>
      </div>
    </div>
  );
}
