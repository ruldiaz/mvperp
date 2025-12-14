"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("¡Correo enviado! Revisa tu bandeja de entrada.");
        setIsSubmitted(true);
        setCountdown(60); // 60 segundos para reenviar

        // Iniciar cuenta regresiva
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.message || "Error al enviar el correo");
      }
    } catch (error) {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 text-3xl font-bold text-blue-700 hover:text-blue-800 transition-colors duration-200"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span>ERP Software</span>
          </Link>
          <p className="text-gray-600 mt-2">Recupera el acceso a tu cuenta</p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {isSubmitted ? "¡Correo enviado!" : "¿Olvidaste tu contraseña?"}
            </h1>
            <p className="text-gray-600">
              {isSubmitted
                ? "Revisa tu bandeja de entrada para restablecer tu contraseña."
                : "Ingresa tu correo y te enviaremos un enlace para restablecerla."}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 transition-all duration-200 outline-none"
                    placeholder="usuario@empresa.com"
                    required
                  />
                </div>
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-pink-600 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center ${isLoading ? "opacity-80 cursor-not-allowed" : ""}`}
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Enviar enlace de recuperación
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Estado después de enviar */
            <div className="space-y-6">
              {/* Mensaje de éxito */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 text-center">
                <svg
                  className="w-12 h-12 text-green-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="font-semibold text-green-800 mb-2">
                  ¡Correo enviado exitosamente!
                </h3>
                <p className="text-green-600 text-sm">
                  Hemos enviado un enlace de recuperación a{" "}
                  <span className="font-semibold">{email}</span>. Revisa tu
                  bandeja de entrada y también la carpeta de spam.
                </p>
              </div>

              {/* Contador para reenviar */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  ¿No recibiste el correo?
                  {countdown > 0 ? (
                    <span className="ml-1 font-semibold text-orange-600">
                      Espera {countdown} segundos
                    </span>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="ml-1 text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      Reenviar correo
                    </button>
                  )}
                </p>
              </div>

              {/* Consejos */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Consejos útiles
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Revisa la carpeta de spam o correo no deseado
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    El enlace expira en 24 horas
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    Asegúrate de ingresar el correo correcto
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
            <Link
              href="/login"
              className="w-full flex items-center justify-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Volver al inicio de sesión
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Ir a la página principal
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ERP Software. Todos los derechos
            reservados.
          </p>
        </div>
      </div>

      {/* Estilos para animación */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
