// src/app/layout.tsx
import { Toaster } from "react-hot-toast";
import "./globals.css";
import ThemeRegistry from "./ThemeRegistry";
import { Providers } from "./providers";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

export const metadata = {
  title: "MVP ERP",
  description: "Enterprise Resource Planning System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body>
        <Providers>
          <ThemeRegistry>
            {children}
            <Toaster position="top-right" reverseOrder={false} />
          </ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
