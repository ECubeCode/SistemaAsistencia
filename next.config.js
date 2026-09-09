/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        // Las respuestas de la API nunca deben quedar cacheadas: si el
        // profesor tiene la pantalla abierta y se corrige una asistencia,
        // tiene que ver el dato nuevo y no una copia guardada del navegador.
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

module.exports = nextConfig;
