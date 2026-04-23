import "./globals.css";
import { Space_Grotesk, DM_Sans } from "next/font/google";
import { Toaster } from "sonner";

const displayFont = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-display",
    weight: ["500", "700"],
});

const bodyFont = DM_Sans({
    subsets: ["latin"],
    variable: "--font-body",
    weight: ["400", "500", "700"],
});

export const metadata = {
    title: "Crypto Safe | Secure Crypto Vault",
    description: "A secure crypto-safe platform to store, protect, and monitor digital assets.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={`${displayFont.variable} ${bodyFont.variable} overflow-x-hidden`}>
            {children}
            <Toaster
                position="top-right"
                richColors
                toastOptions={{
                    style: {
                        background: "rgba(8, 10, 13, 0.96)",
                        color: "#f2f3f6",
                        border: "1px solid rgba(221, 192, 138, 0.36)",
                    },
                }}
            />
        </body>
        </html>
    );
}
