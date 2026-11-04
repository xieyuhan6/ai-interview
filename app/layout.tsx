import type { Metadata } from "next";
import FirebaseAnalytics from "@/components/FirebaseAnalytics";
import "./globals.css";
export const metadata: Metadata = {
  title: "Interview Helper · Interview and Resume Assistant",
  description:
    "AI practice interviews, resume improvements, and personal progress tracking",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased pattern">
        <FirebaseAnalytics />
        {children}
      </body>
    </html>
  );
}
