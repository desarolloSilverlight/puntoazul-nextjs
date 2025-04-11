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
    "/img/carrusel/img1.PNG",
    "/img/carrusel/img2.PNG",
    "/img/carrusel/img3.PNG",
    "/img/carrusel/img4.PNG"
  ];

  const carouselHeight = '390px'; // Puedes ajustar esto

  return (
    <div className="relative w-full overflow-hidden" style={{ height: carouselHeight }}>
      {/* Carrusel principal */}
      <Slider {...settings} className="absolute inset-0" style={{ height: carouselHeight }}>
        {images.map((img, index) => (
          <div key={index} style={{ height: carouselHeight }}>
            <Image
              src={img}
              alt={`Background ${index + 1}`}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              width={400}
              height={200}
            />
          </div>
        ))}
      </Slider>

      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-black/30" style={{ height: carouselHeight }} />

      {/* Contenido encima del carrusel */}
      <div className="relative z-10 h-full flex flex-col justify-between p-8 text-white">
        <div className="flex justify-between items-start">
          <div className="space-x-6">
            <a href="#" className="hover:underline">Information</a>
            <a href="#" className="hover:underline">Productos</a>
          </div>
          <span className="font-medium">ADMINISTRATOR</span>
        </div>

        <div>{/* Aquí puedes meter tus tarjetas */}</div>
      </div>
    </div>
  );
}
