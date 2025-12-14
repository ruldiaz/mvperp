import Link from "next/link";

// src/app/landing/page.tsx
export default function LandingPage() {
  const sections = [
    {
      id: "punto-venta",
      title: "Punto de Venta",
      content: "Sistema de punto de venta avanzado para tu negocio",
      color: "from-green-50 to-blue-50",
      icon: "💰",
    },
    {
      id: "facturacion",
      title: "Facturación",
      content: "Solución de facturación electrónica 100% compatible",
      color: "from-blue-50 to-purple-50",
      icon: "🧾",
    },
    {
      id: "inventario",
      title: "Inventario",
      content: "Control de inventario en tiempo real con alertas automáticas",
      color: "from-purple-50 to-pink-50",
      icon: "📦",
    },
    {
      id: "tienda-linea",
      title: "Tienda en Línea",
      content: "E-commerce integrado con tu sistema ERP",
      color: "from-pink-50 to-orange-50",
      icon: "🛒",
    },
    {
      id: "precios",
      title: "Precios",
      content: "Planes flexibles adaptados a cada negocio",
      color: "from-orange-50 to-yellow-50",
      icon: "🏷️",
    },
    {
      id: "distribuidores",
      title: "Distribuidores",
      content: "Conviértete en distribuidor y genera ingresos extra",
      color: "from-yellow-50 to-green-50",
      icon: "🤝",
    },
    {
      id: "compania",
      title: "Compañía",
      content: "Más de 10 años innovando en soluciones ERP",
      color: "from-gray-50 to-blue-50",
      icon: "🏢",
    },
    {
      id: "soluciones",
      title: "Soluciones",
      content: "Soluciones empresariales para todos los sectores",
      color: "from-blue-50 to-indigo-50",
      icon: "🚀",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <title>ERP Software</title>
      {/* Sección principal */}
      <div
        id="landing-top"
        className="pt-24 pb-16 px-4 text-center bg-gradient-to-r from-blue-600 to-indigo-700 text-white"
      >
        <div className="max-w-4xl mx-auto">
          <p
            id="landing-title"
            className="text-5xl font-bold mb-6 leading-tight"
          >
            Somos un software especializado ERP
          </p>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Gestiona tu negocio de manera integral con nuestras soluciones
            tecnológicas
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="#funcionalidades"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Ver Funcionalidades
            </a>
            <a
              href="#precios"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-all duration-200"
            >
              Ver Precios
            </a>
          </div>
        </div>
      </div>

      {/* Secciones de contenido */}
      <div className="max-w-6xl mx-auto px-4 py-12" id="funcionalidades">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={`mb-16 scroll-mt-24 p-8 rounded-2xl bg-gradient-to-r ${section.color} border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300`}
          >
            <div className="flex items-start space-x-6">
              <div className="text-4xl bg-white p-4 rounded-xl shadow-sm">
                {section.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">
                    {section.title}
                  </h2>
                  <a
                    href="#landing-top"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    Volver arriba
                  </a>
                </div>
                <p className="text-gray-600 text-lg mb-6">{section.content}</p>
                <div className="mt-6 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">
                    Características principales
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <li className="flex items-center text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Característica destacada 1
                    </li>
                    <li className="flex items-center text-gray-700">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Característica destacada 2
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* Enlaces rápidos al final */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Navega rápidamente por nuestras secciones
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="bg-white/5 hover:bg-white/10 p-4 rounded-lg transition-all duration-200 group"
              >
                <div className="text-lg font-medium mb-1 group-hover:text-blue-300">
                  {section.title}
                </div>
                <div className="text-sm text-gray-300">
                  Haz clic para ver detalles
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-8 pt-8 border-t border-white/10">
            <Link
              href="/login"
              className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Comienza ahora →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
