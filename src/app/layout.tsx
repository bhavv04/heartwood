import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bhavdeep Arora",
  description:
    "Systems software and empirical research in applied machine learning and quantitative finance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t)document.documentElement.dataset.theme=t}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}