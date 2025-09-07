// src/app/landing/layout.tsx
import Navbar from "./navbar/Navbar";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
}
