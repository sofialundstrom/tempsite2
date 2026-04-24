import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const rockwell = localFont({
  src: "./fonts/Rockwell-Bold.woff2",
});

export const metadata: Metadata = {
  title: "Skurkeriet",
  description: "Något spännande är på gång...",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${rockwell.className} min-h-screen`}>
        {children}
      </body>
    </html>
  );
}