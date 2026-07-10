import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const rockwell = localFont({
  src: "./fonts/Rockwell-Bold.woff2",
});

export const metadata: Metadata = {
  title: "Skurkeriet",
  description: "Något spännande på väg",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body className={`${rockwell.className} min-h-screen`}>
        {children}
      </body>
    </html>
  );
}