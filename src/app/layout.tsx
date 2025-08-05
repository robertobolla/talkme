import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import Navbar from '@/components/Navbar';
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ElderCare - Plataforma de Cuidado de Ancianos',
  description: 'Conectamos familias con profesionales de cuidado de ancianos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className={inter.className}>
          <Navbar />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
          <ToastProvider />
        </body>
      </html>
    </ClerkProvider>
  );
}
