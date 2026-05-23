import './globals.css';

export const metadata = {
  title: 'ArthillesBot',
  description: 'Dashboard administrativo local para WhatsApp e agenda',
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
