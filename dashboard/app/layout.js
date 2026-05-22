import './globals.css';

export const metadata = {
  title: 'ArthillesBot',
  description: 'Dashboard administrativo local para WhatsApp e agenda'
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
