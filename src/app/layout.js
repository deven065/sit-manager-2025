import { QueryProvider } from "@/lib/query/provider";

export const metadata = {
  title: "SIT Manager 2025",
  description: "Backend API with comprehensive caching strategy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
