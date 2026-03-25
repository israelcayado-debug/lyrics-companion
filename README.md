# Lyrics Companion

Web app ligera para iPhone que detecta la cancion actual de Spotify y muestra su letra en una vista limpia, pensada para abrirse desde la pantalla de inicio.

## Stack

- Next.js
- Vercel
- Spotify Web API
- LRCLIB con fallback a lyrics.ovh

## Variables de entorno

Usa el archivo `.env.example` como referencia:

- `APP_URL`: URL base de la app. En local sera `http://127.0.0.1:3000`.
- `SPOTIFY_CLIENT_ID`: Client ID de tu app de Spotify.
- `SPOTIFY_CLIENT_SECRET`: Client Secret de tu app de Spotify.
- `SPOTIFY_REDIRECT_URI`: Debe coincidir con la Redirect URI configurada en Spotify.
- `SESSION_SECRET`: Cadena larga aleatoria para firmar la cookie de sesion.
- `LYRICS_PROVIDER`: `lrclib` o `lyricsovh`.

## Spotify Developer

1. Crea una app en Spotify Developer Dashboard.
2. Anade estas Redirect URIs:
   - `http://127.0.0.1:3000/api/auth/callback`
   - `https://TU-PROYECTO.vercel.app/api/auth/callback`
3. Copia `Client ID` y `Client Secret` a tus variables de entorno.

## Desarrollo local

```bash
npm install
npm run dev
```

## Despliegue en Vercel

1. Sube esta carpeta a GitHub.
2. Importa el repositorio en Vercel.
3. Configura las variables de entorno del proyecto.
4. Despliega.
5. Cuando tengas la URL final de Vercel, confirma que coincide con `SPOTIFY_REDIRECT_URI`.

## Uso

1. Abre la web en el iPhone.
2. Pulsa `Conectar Spotify`.
3. Reproduce musica en Spotify.
4. Anade la web a pantalla de inicio desde Safari si quieres usarla como pseudoapp.
