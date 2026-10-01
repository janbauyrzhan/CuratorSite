import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'], weight: ['400','500','600','700','800','900'] });

export const metadata = {
  title: 'infoLogia • Куратор сайты',
  description: 'Жұптық жұмыс генераторы',
};

export default function RootLayout({ children }) {
  return (
    <html lang="kk">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
