"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { SUNO_SOUNDTRACKS, sunoEmbedUrl } from "../../lib/suno-catalog";

// Experimental standalone page. This does not change existing rooms/gameplay.
// Suno's iframe is cross-origin: playback, volume, looping, and autoplay cannot
// be programmatically controlled with this simple supported embedding method.
const STORAGE_KEY = "know-show-suno-catalog-v2";
const pill: CSSProperties = {
  border: "1px solid #b7d1c9",
  borderRadius: 12,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};

export default function MusicTestPage() {
  const [genreIndex, setGenreIndex] = useState(0);
  const [version, setVersion] = useState<0 | 1>(0);
  const [showPlayer, setShowPlayer] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (data && Number.isInteger(data.genreIndex) && data.genreIndex >= 0 && data.genreIndex < SUNO_SOUNDTRACKS.length) {
        setGenreIndex(data.genreIndex);
      }
      if (data && (data.version === 0 || data.version === 1)) setVersion(data.version);
    } catch { /* Local preferences are optional. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ genreIndex, version })); } catch { /* optional */ }
  }, [genreIndex, version, ready]);

  const genre = SUNO_SOUNDTRACKS[genreIndex];
  const track = genre.arrangements[version];

  function selectGenre(index: number) {
    setGenreIndex(index);
    setVersion(0);
    setShowPlayer(true);
  }

  function selectVersion(next: 0 | 1) {
    setVersion(next);
    setShowPlayer(true);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f3f6f4", color: "#173a3a", padding: "30px 16px 72px" }}>
      <div style={{ maxWidth: 1040, margin: "auto" }}>
        <a href="/" style={{ color: "#17685d", fontWeight: 700, textDecoration: "none" }}>← Back to The Know Show</a>
        <header style={{ margin: "32px 0 25px" }}>
          <p style={{ color: "#17685d", fontWeight: 800, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Free Suno soundtrack experiment</p>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.3rem)", margin: "10px 0" }}>Trivia Time Warp</h1>
          <p style={{ maxWidth: 780, lineHeight: 1.6, color: "#5b6b69" }}>
            Your twelve tracks, organized into six musical styles. Choose a genre and either arrangement, then press Play inside the embedded Suno player.
          </p>
        </header>
        <section aria-label="Choose soundtrack genre" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 24 }}>
          {SUNO_SOUNDTRACKS.map((item, index) => (
            <button key={item.id} type="button" onClick={() => selectGenre(index)} aria-pressed={index === genreIndex}
              style={{ ...pill, minHeight: 86, textAlign: "left", background: index === genreIndex ? "#174d4c" : "#fff", color: index === genreIndex ? "#fff" : "#174d4c", borderColor: index === genreIndex ? "#174d4c" : "#c8d8d3" }}>
              <span style={{ display: "block", fontSize: 15 }}>{item.label}</span>
              <span style={{ display: "block", opacity: 0.75, fontSize: 12, marginTop: 7, fontWeight: 500 }}>2 arrangements</span>
            </button>
          ))}
        </section>
        <section style={{ background: "#fff", border: "1px solid #d8e4dd", borderRadius: 18, padding: "clamp(18px,3vw,32px)" }}>
          <h2 style={{ margin: 0, fontSize: 28 }}>{genre.label}</h2>
          <p style={{ color: "#5b6b69", margin: "8px 0 22px" }}>{genre.description}</p>
          <div role="group" aria-label="Choose song arrangement" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
            {genre.arrangements.map((arrangement, index) => (
              <button key={arrangement.id} type="button" onClick={() => selectVersion(index as 0 | 1)} aria-pressed={version === index}
                style={{ ...pill, background: version === index ? "#dbece6" : "#fff", color: "#173a3a", borderColor: version === index ? "#257864" : "#c8d8d3" }}>
                Arrangement {index + 1}
              </button>
            ))}
          </div>
          <p style={{ fontWeight: 700, marginBottom: 12 }}>{track.title}</p>
          {showPlayer ? (
            <iframe key={track.id} src={sunoEmbedUrl(track.id)} title={`${genre.label} – ${track.title}`}
              allow="autoplay; encrypted-media; fullscreen" loading="eager"
              style={{ display: "block", width: "100%", maxWidth: 760, height: 245, border: 0, background: "#eef4f0", borderRadius: 12 }}/>
          ) : (
            <div style={{ display: "grid", placeItems: "center", width: "100%", maxWidth: 760, minHeight: 180, borderRadius: 12, background: "#eef4f0", color: "#546c64" }}>Suno player unloaded; audio stopped.</div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={() => setShowPlayer((value) => !value)} style={{ ...pill, color: "#173a3a", background: "#fff" }}>
              {showPlayer ? "Stop / unload player" : "Reload player"}
            </button>
            <a href={track.shareUrl} target="_blank" rel="noopener noreferrer" style={{ ...pill, display: "inline-flex", alignItems: "center", background: "#fff", color: "#17685d", textDecoration: "none" }}>
              Open this song on Suno ↗
            </a>
          </div>
        </section>
        <p style={{ marginTop: 24, color: "#637571", lineHeight: 1.6, fontSize: 13 }}>
          Switching genres or arrangements reloads the Suno player and stops the previous track. You may need to click Play again. This is a preview page only: it does not yet enable host-phone remote playback or in-game music. Suno controls the embedded audio, including volume and looping. Classical is not yet part of this 12-track collection.
        </p>
      </div>
    </main>
  );
}
