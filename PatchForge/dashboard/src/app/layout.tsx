import './globals.css';

export const metadata = {
  title: 'PatchForge Dashboard',
  description: 'Autonomous Security & Dependency Migration Suite Monitor',
};

export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  );
}
