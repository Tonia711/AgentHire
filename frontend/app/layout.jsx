import './globals.css';

export const metadata = {
  title: 'AgentHire',
  description: 'AI-powered Web3 service marketplace'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}