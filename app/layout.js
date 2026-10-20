import './globals.css';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata = {
  title: 'infoLogia • Куратор сайты',
  description: 'Жұптық жұмыс генераторы',
  icons: {
    icon: '/infologia-logo.png',
    shortcut: '/infologia-logo.png',
    apple: '/infologia-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="kk" className={montserrat.variable}>
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
