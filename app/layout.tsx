import type { Metadata } from "next";
import { Mulish } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Toaster } from "./_components/ui/sonner";

const mulish = Mulish({
  subsets: ["latin-ext"],
});

export const metadata: Metadata = {
  title: "Finance AI | Gestão Financeira Inteligente",
  description:
    "Plataforma de gestão financeira com inteligência artificial para monitorar suas movimentações e oferecer insights personalizados.",
  keywords: ["finanças", "gestão financeira", "IA", "investimentos", "despesas"],
  authors: [{ name: "Finance AI" }],
  openGraph: {
    title: "Finance AI | Gestão Financeira Inteligente",
    description:
      "Monitore suas finanças com o poder da inteligência artificial.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${mulish.className} dark antialiased`}>
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorBackground: "#1c1917",
              colorInputBackground: "#1c1917",
              colorText: "#ffffff",
              colorTextSecondary: "#a1a1aa",
              colorPrimary: "#55b02e",
              colorInputText: "#ffffff",
              borderRadius: "0.5rem",
            },
          }}
        >
          <div className="flex h-full flex-col overflow-hidden">{children}</div>
        </ClerkProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
