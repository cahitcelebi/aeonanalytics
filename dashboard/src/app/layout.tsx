import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import './globals.css'
import ClientLayout from './client-layout'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aeon Analytics",
  description: "Game Analytics Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* <link rel="stylesheet" href="/tailwind-test.css" /> */}
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        <Header />
        <main className="flex flex-col min-h-screen pt-4">
          <AuthProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </AuthProvider>
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
