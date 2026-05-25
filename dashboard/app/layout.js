import './globals.css';

export const metadata = {
  title: 'ArthillesBot',
  description: 'Dashboard SaaS para WhatsApp, agenda e IA',
  manifest: '/manifest.webmanifest'
};

export const viewport = {
  themeColor: '#176b87',
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
