import "./style.css";

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {/* Pas de Sidebar ici ! */}
        <main>{children}</main>
      </body>
    </html>
  );
}