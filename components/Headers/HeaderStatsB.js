import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Image from "next/image";

export default function HeaderStats() {
  const settings = {
    dots: false,
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
    "/img/carrusel/img1.PNG",
    "/img/carrusel/img2.PNG",
    "/img/carrusel/img3.PNG",
    "/img/carrusel/img4.PNG"
  ];

  const carouselHeight = '390px'; // Puedes ajustar esto

  return (
    <div className="relative h-350-px overflow-hidden w-full">
      {/* Carrusel principal */}
      <Slider {...settings} className="">
        {images.map((img, index) => (
          <div key={index} className="">
            <Image
              src={img}
              alt={`Background ${index + 1}`}
              loading="lazy"
              width={1800}
              height={500}
              className="h-350-px w-full"
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
