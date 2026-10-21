import type { Metadata } from "next";
import { Inter, Kanit, Krub } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400"],
});

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "700"],
  style: ["normal", "italic"],
});

const krub = Krub({
  variable: "--font-krub",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Fplaces — Find places, find people, find your way",
  description:
    "Navigate, discover, and share your way through any venue with Fplaces.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${kanit.variable} ${krub.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
