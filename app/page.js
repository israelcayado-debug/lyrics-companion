"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 5000;
const AUTOSCROLL_TICK_MS = 1200;

function formatStatus(item) {
  if (!item) return "";
  const minutes = Math.floor((item.progressMs || 0) / 60000);
  const seconds = Math.floor(((item.progressMs || 0) % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return item.isPlaying ? `En reproduccion · ${minutes}:${seconds}` : `Pausado · ${minutes}:${seconds}`;
}

function LyricsBlock({ text, activeIndex, lyricsRef }) {
  if (!text) {
    return (
      <div className="empty-state">
        <p>No he encontrado letra para la cancion actual.</p>
      </div>
    );
  }

  return (
    <div className="lyrics-card" ref={lyricsRef}>
      {text.split("\n").map((line, index) => (
        <p
          key={`${index}-${line.slice(0, 12)}`}
          className={`lyric-line ${index === activeIndex ? "is-active" : ""} ${
            index < activeIndex ? "is-past" : ""
          }`}
        >
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
  const [autoScroll, setAutoScroll] = useState(true);
  const [activeLine, setActiveLine] = useState(0);
  const pollingRef = useRef(null);
  const scrollTimerRef = useRef(null);
  const lyricsRef = useRef(null);

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

  useEffect(() => {
    const text = state.lyrics?.plainText || "";
    const lines = text ? text.split("\n") : [];
    const scroller = lyricsRef.current;

    if (!scroller || !lines.length) {
      setActiveLine(0);
      return undefined;
    }

    const maxScroll = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const durationMs = Math.max(state.item?.durationMs || 0, 1);
    const progressMs = Math.min(state.item?.progressMs || 0, durationMs);
    const ratio = progressMs / durationMs;
    const targetScroll = maxScroll * ratio;
    const initialLine = Math.min(lines.length - 1, Math.floor(ratio * lines.length));

    scroller.scrollTo({ top: targetScroll, behavior: "smooth" });
    setActiveLine(initialLine);

    if (!autoScroll || !state.item?.isPlaying || maxScroll === 0) {
      return undefined;
    }

    let currentProgress = progressMs;
    scrollTimerRef.current = window.setInterval(() => {
      currentProgress = Math.min(currentProgress + AUTOSCROLL_TICK_MS, durationMs);
      const nextRatio = currentProgress / durationMs;
      const nextScroll = maxScroll * nextRatio;
      const nextLine = Math.min(lines.length - 1, Math.floor(nextRatio * lines.length));
      scroller.scrollTo({ top: nextScroll, behavior: "smooth" });
      setActiveLine(nextLine);
    }, AUTOSCROLL_TICK_MS);

    return () => {
      if (scrollTimerRef.current) {
        window.clearInterval(scrollTimerRef.current);
      }
    };
  }, [state.item?.id, state.item?.progressMs, state.item?.durationMs, state.item?.isPlaying, state.lyrics?.plainText, autoScroll]);

  async function refreshNow() {
    setState((current) => ({ ...current, status: current.status === "signed-out" ? current.status : "loading" }));
    try {
      const response = await fetch("/api/playback", {
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401) {
        setState({ status: "signed-out", item: null, lyrics: null, provider: null, error: null });
        return;
      }

      const payload = await response.json();
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
      setState({
        status: "error",
        item: null,
        lyrics: null,
        provider: null,
        error: "Error de red al consultar Spotify.",
      });
    }
  }

  const isSignedOut = state.status === "signed-out";
  const isLoading = state.status === "loading";
  const item = state.item;
  const hasPlayback = Boolean(item);

  return (
    <main className={`app-shell ${hasPlayback ? "is-immersive" : ""}`}>
      <section className={`hero-panel ${hasPlayback ? "is-condensed" : ""}`}>
        <div className="hero-copy">
          <span className="eyebrow">Spotify Lyrics Companion</span>
          {hasPlayback ? (
            <>
              <h1>Modo karaoke.</h1>
              <p>Vista inmersiva para seguir la letra en el iPhone sin distracciones.</p>
            </>
          ) : (
            <>
              <h1>Letras grandes y limpias en tu iPhone mientras escuchas Spotify.</h1>
              <p>
                Pensado para abrirlo desde la pantalla de inicio. Consulta Spotify, detecta la
                cancion actual y busca la letra automaticamente.
              </p>
            </>
          )}
        </div>

        <div className="actions">
          {isSignedOut ? (
            <a className="primary-button" href="/api/auth/login">
              Conectar Spotify
            </a>
          ) : (
            <>
              <button className="primary-button" onClick={refreshNow} type="button">
                Actualizar ahora
              </button>
              <button
                className={`toggle-button ${autoScroll ? "is-enabled" : ""}`}
                onClick={() => setAutoScroll((value) => !value)}
                type="button"
              >
                {autoScroll ? "Autoscroll activo" : "Autoscroll manual"}
              </button>
              <a className="secondary-link" href="/api/auth/logout">
                Cerrar sesion
              </a>
            </>
          )}
        </div>
      </section>

      <section className={`now-playing-panel ${hasPlayback ? "is-immersive" : ""}`}>
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
                <span className="playback-status">{formatStatus(item)}</span>
                {state.provider ? (
                  <span className="provider-note">Letra: {state.provider}</span>
                ) : null}
              </div>
            </div>

            <LyricsBlock
              text={state.lyrics?.plainText || ""}
              activeIndex={activeLine}
              lyricsRef={lyricsRef}
            />
          </>
        ) : null}
      </section>
    </main>
  );
}
