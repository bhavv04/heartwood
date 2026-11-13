import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import { CatProvider } from "@/context/CatContext";
import Oneko from "@/components/Oneko";
import Scene from "@/components/Scene";

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
            __html: `try{var t=localStorage.getItem('theme')||'dark',n=t==='dark',d=document.documentElement,s=d.style;d.dataset.theme=t;s.setProperty('--sky-bg',n?'#0a0a0a':'#f7efe4');s.setProperty('--sky-line',n?'#1d1d1d':'#ecdfd0');s.setProperty('--sky-t',n?'1':'0')}catch(e){document.documentElement.dataset.theme='dark'}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <CatProvider>
          <Scene>{children}</Scene>
          <Oneko />
        </CatProvider>
      </body>
    </html>
  );
}
