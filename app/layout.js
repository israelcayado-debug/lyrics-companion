import "./globals.css";

export const metadata = {
  title: "Lyrics Companion",
  description: "Shows lyrics for the song currently playing on Spotify.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lyrics",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
