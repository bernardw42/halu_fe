import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ClientNavigationHandler from "../components/ClientNavigationHandler";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Halu Commerce",
  description: "A minimalist blue ecommerce experience for buyers and sellers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${mono.variable} font-sans antialiased`}>
        <ClientNavigationHandler />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              border: "1px solid #d7e3f7",
              borderRadius: "18px",
              background: "#ffffff",
              color: "#0f172a",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
