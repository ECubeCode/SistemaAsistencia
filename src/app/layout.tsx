import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Asistencia PP - E.T. N°3 D.E. 9° María Sánchez de Thompson",
  description: "Registro de asistencia de Prácticas Profesionalizantes",
  // Ícono chico y aparte: el logo completo pesa demasiado para un favicon.
  icons: { icon: "/icon.png" },
};

// La app se usa mayormente desde el celular: se fija el ancho al del
// dispositivo y se deja el zoom habilitado (no se limita maximumScale por
// accesibilidad).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4B2E83",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
