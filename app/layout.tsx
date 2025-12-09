import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "BeauTrip - 믿고 찾는 K-Beauty 메디컬 여행 플랫폼",
  description: "뷰티 여행을 떠나세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex justify-center">
        <LanguageProvider>
          <div className="w-full max-w-md bg-white min-h-screen shadow-lg">
            {children}
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
