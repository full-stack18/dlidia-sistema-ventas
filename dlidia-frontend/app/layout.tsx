import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Importamos la fuente Montserrat de Google Fonts
const montserrat = Montserrat({ subsets: ["latin"], weight: ['400', '500', '700', '800'] });

export const metadata: Metadata = {
  title: "D' Lidia - Chifa y Pollería",
  description: "El mejor sabor de Quilmaná directo a tu mesa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      {/* Aplicamos la fuente a todo el cuerpo del documento */}
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}