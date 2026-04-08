import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
    title: "JLC Portal - ระบบจัดการรวม",
    description: "ระบบจัดการรวมทรัพย์สินและจัดสรรสต็อก",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="th" suppressHydrationWarning>
            <body className="bg-gray-50 dark:bg-[#0a0a1a] transition-colors duration-300">
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}
