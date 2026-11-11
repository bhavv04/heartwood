import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { CatProvider } from "@/context/CatContext";
import Oneko from "@/components/Oneko";
import SkyTheme from "@/components/SkyTheme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bhavdeep Arora",
    template: "%s | Bhavdeep Arora",
  },
  description: site.bio,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <CatProvider>
          <SkyTheme />
          <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
          <Oneko />
        </CatProvider>
      </body>
    </html>
  );
}
