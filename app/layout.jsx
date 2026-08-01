import './globals.css';

export const metadata = {
  title: 'Catatin - Finance Tracker with Gemma 4 & Google Sheets Sync',
  description: 'Personal Finance app powered by Google Agent Development Kit and Gemma 4 26B A4B IT',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-slate-900 text-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
