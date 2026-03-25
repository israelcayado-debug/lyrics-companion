"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 15000;

function LyricsBlock({ text }) {
  if (!text) {
    return (
      <div className="empty-state">
        <p>No he encontrado letra para la cancion actual.</p>
      </div>
    );
  }

  return (
    <div className="lyrics-card">
      {text.split("\n").map((line, index) => (
        <p key={`${index}-${line.slice(0, 12)}`} className="lyric-line">
          {line || "\u00A0"}
        </p>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [state, setState] = useState({
    status: "loading",
    item: null,
    lyrics: null,
    provider: null,
    error: null,
  });
  const pollingRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function loadPlayback() {
      try {
        const response = await fetch("/api/playback", {
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401) {
          if (!active) return;
          setState({ status: "signed-out", item: null, lyrics: null, provider: null, error: null });
          return;
        }

        const payload = await response.json();
        if (!active) return;

        if (!response.ok) {
          setState({
            status: "error",
            item: null,
            lyrics: null,
            provider: null,
            error: payload.error || "No se pudo cargar la reproduccion actual.",
          });
          return;
        }

        setState({
          status: "ready",
          item: payload.item,
          lyrics: payload.lyrics,
          provider: payload.provider,
          error: null,
        });
      } catch {
        if (!active) return;
        setState({
          status: "error",
          item: null,
          lyrics: null,
          provider: null,
          error: "Error de red al consultar Spotify.",
        });
      }
    }

    loadPlayback();
    pollingRef.current = window.setInterval(loadPlayback, POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
      }
    };
  }, []);

  const isSignedOut = state.status === "signed-out";
  const isLoading = state.status === "loading";
  const item = state.item;

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">Spotify Lyrics Companion</span>
          <h1>Letras grandes y limpias en tu iPhone mientras escuchas Spotify.</h1>
          <p>
            Pensado para abrirlo desde la pantalla de inicio. Consulta Spotify, detecta la
            cancion actual y busca la letra automaticamente.
          </p>
        </div>

        <div className="actions">
          {isSignedOut ? (
            <a className="primary-button" href="/api/auth/login">
              Conectar Spotify
            </a>
          ) : (
            <>
              <button
                className="primary-button"
                onClick={() => window.location.reload()}
                type="button"
              >
                Actualizar ahora
              </button>
              <a className="secondary-link" href="/api/auth/logout">
                Cerrar sesion
              </a>
            </>
          )}
        </div>
      </section>

      <section className="now-playing-panel">
        {isLoading ? (
          <div className="empty-state">
            <p>Cargando reproduccion actual...</p>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="empty-state error-state">
            <p>{state.error}</p>
          </div>
        ) : null}

        {state.status === "ready" && !item ? (
          <div className="empty-state">
            <p>No hay ninguna cancion sonando ahora mismo en Spotify.</p>
          </div>
        ) : null}

        {item ? (
          <>
            <div className="song-header">
              {item.albumArt ? (
                <img className="cover-art" src={item.albumArt} alt={`Portada de ${item.title}`} />
              ) : null}

              <div className="song-meta">
                <span className="meta-label">Reproduciendo ahora</span>
                <h2>{item.title}</h2>
                <p>{item.artist}</p>
                {item.album ? <span className="meta-note">{item.album}</span> : null}
                {state.provider ? (
                  <span className="provider-note">Letra: {state.provider}</span>
                ) : null}
              </div>
            </div>

            <LyricsBlock text={state.lyrics?.plainText || ""} />
          </>
        ) : null}
      </section>
    </main>
  );
}
