import "./globals.css";

export const metadata = {
    title: "Crypto Earnings",
    description: "Trade Forex, Commodities, and Crypto with a modern platform.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body>{children}</body>
        </html>
    );
}
