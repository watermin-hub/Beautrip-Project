import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Script from "next/script";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "☁️BeauTrip - 믿고 찾는 K-Beauty 메디컬 여행 플랫폼✈️",
  // description: "뷰티 여행을 떠나세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script id="hotjar-cs" strategy="afterInteractive">
          {`
            (function (c, s, q, u, a, r, e) {
              c.hj=c.hj||function(){(c.hj.q=c.hj.q||[]).push(arguments)};
              c._hjSettings = { hjid: a };
              r = s.getElementsByTagName('head')[0];
              e = s.createElement('script');
              e.async = true;
              e.src = q + c._hjSettings.hjid + u;
              r.appendChild(e);
            })(window, document, 'https://static.hj.contentsquare.net/c/csq-', '.js', 6601517);
          `}
        </Script>
      </head>
      <body className="flex justify-center">
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
