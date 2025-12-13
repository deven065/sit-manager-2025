<<<<<<< HEAD
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
=======
import { QueryProvider } from "@/lib/query/provider";
>>>>>>> 5a50afd797f90c1aa2140b3879bcaf3833f85831

export const metadata = {
  title: "SIT Manager 2025",
  description: "Backend API with comprehensive caching strategy",
};

export default function RootLayout({ children }) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
=======
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
>>>>>>> 5a50afd797f90c1aa2140b3879bcaf3833f85831
      </body>
    </html>
  );
}
