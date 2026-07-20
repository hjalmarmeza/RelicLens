import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RelicLens",
  description: "Descubre el valor de tus antigüedades con Inteligencia Artificial",
  icons: {
    icon: '/RelicLens.jpg',
    apple: '/RelicLens.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
