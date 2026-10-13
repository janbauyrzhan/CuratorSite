import './globals.css';
import { Open_Sans } from 'next/font/google';

const openSans = Open_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-open-sans',
  display: 'swap',
});

export const metadata = {
  title: 'infoLogia • Куратор сайты',
  description: 'Жұптық жұмыс генераторы',
};

export default function RootLayout({ children }) {
  return (
    <html lang="kk" className={openSans.variable}>
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
