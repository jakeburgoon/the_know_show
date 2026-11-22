"use client";

import { useEffect, useState } from "react";

// This is a separate, isolated proof-of-concept page. It does not touch the game engine.
// Suno owns the audio player; cross-origin controls (volume, play/pause, position)
// are intentionally not attempted.
const STYLES = [
  { id: "retro", name: "Retro 80s", description: "Your Trivia Time Warp synth-pop arrangement" },
  { id: "indie", name: "Indie / Dream Pop", description: "Guitar, soft synths, nostalgic textures" },
  { id: "jazz", name: "Cool Jazz", description: "Piano, trumpet, brushed drums" },
  { id: "classical", name: "Classical", description: "Piano, strings, chamber ensemble" },
  { id: "game", name: "Classic Game Show", description: "Bright, cheerful orchestration" },
  { id: "pop", name: "Modern Pop", description: "Lively, contemporary sound" },
  { id: "cinematic", name: "Cinematic", description: "Atmospheric, dramatic arrangement" },
] as const;

type StyleId = (typeof STYLES)[number]["id"];
type SongMap = Partial<Record<StyleId, string>>;
const STORAGE_KEY = "know-show-suno-test-songs-v1";
const SAMPLE_ID = "35d82643-cbf4-4095-aae3-fc36708d2fcf";
const SONG_RE = /(?:suno\.com\/(?:song|embed)\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

function songIdFrom(text: string): string | null {
  const trimmed = text.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return trimmed;
  return trimmed.match(SONG_RE)?.[1] ?? null;
}

const button: React.CSSProperties = { border: "1px solid #bfd4d0", borderRadius: 10, padding: "12px 15px", background: "white", color: "#19353b", fontWeight: 700, cursor: "pointer" };

export default function MusicTestPage() {
  const [selected, setSelected] = useState<StyleId>("retro");
  const [songs, setSongs] = useState<SongMap>({ retro: SAMPLE_ID });
  const [draft, setDraft] = useState("");
  const [playing, setPlaying] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const local = window.localStorage.getItem(STORAGE_KEY);
      if (local) setSongs({ retro: SAMPLE_ID, ...(JSON.parse(local) as SongMap) });
    } catch { /* Browser storage is optional. */ }
  }, []);

  const selectedStyle = STYLES.find((s) => s.id === selected)!;
  const currentId = songs[selected];

  function chooseStyle(id: StyleId) {
    setPlaying(false); // Unmounting the iframe stops any playing audio.
    setSelected(id);
    setMessage("");
    setDraft("");
    setPlaying(true); // Player loads, but user may need to press Play inside it.
  }

  function saveSong() {
    const id = songIdFrom(draft);
    if (!id) {
      setMessage("Use the full Suno song URL (suno.com/song/...) or embed URL, not a short /s/ link.");
      return;
    }
    const next = { ...songs, [selected]: id };
    setSongs(next);
    setPlaying(true);
    setMessage("Saved in this browser for testing. Press Play in the embedded player.");
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* optional */ }
  }

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "30px 18px 70px", color: "#18343a" }}>
      <a href="/" style={{ fontWeight: 700, color: "#13766e", textDecoration: "none" }}>← The Know Show</a>
      <div style={{ padding: "34px 0 20px" }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", color: "#13766e" }}>FREE EXPERIMENT · NOT PART OF A GAME</span>
        <h1 style={{ fontSize: "clamp(2.2rem,6vw,4.1rem)", lineHeight: 1.02, margin: "13px 0" }}>Soundtrack Lab</h1>
        <p style={{ color: "#53696e", maxWidth: 780 }}>Can The Know Show play your Suno arrangements without downloading them? Try the real embedded Suno player below. Switch styles, and paste full song links to add the other arrangements.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 9, margin: "20px 0 30px" }}>
        {STYLES.map((s) => (
          <button type="button" key={s.id} onClick={() => chooseStyle(s.id)} aria-pressed={selected === s.id}
            style={{ ...button, textAlign: "left", background: selected === s.id ? "#173b46" : "#fff", color: selected === s.id ? "#fff" : "#173b46", borderColor: selected === s.id ? "#173b46" : "#bfd4d0" }}>
            <span style={{ display: "block", fontSize: 14 }}>{s.name}</span>
            <span style={{ display: "block", fontSize: 11, fontWeight: 500, opacity: .7, marginTop: 6 }}>{songs[s.id] ? "Track ready" : "Add a Suno song"}</span>
          </button>
        ))}
      </div>
      <section style={{ background: "#fff", border: "1px solid #d7e4df", borderRadius: 20, padding: "clamp(18px,3vw,32px)", boxShadow: "0 7px 40px #1a36320d" }}>
        <h2 style={{ fontSize: 26, margin: 0 }}>{selectedStyle.name}</h2>
        <p style={{ color: "#60757b", margin: "7px 0 22px" }}>{selectedStyle.description}</p>
        {currentId ? (
          <>
            {playing && <iframe key={`${selected}-${currentId}`} src={`https://suno.com/embed/${currentId}`} title={`Suno player – ${selectedStyle.name}`}
              allow="autoplay; encrypted-media; fullscreen" loading="eager"
              style={{ width: "100%", maxWidth: 760, height: 240, border: 0, display: "block", background: "#eef4f1", borderRadius: 12 }} />}
            <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 18 }}>
              <button type="button" onClick={() => setPlaying((p) => !p)} style={button}>{playing ? "Stop / unload player" : "Reload player"}</button>
              <a href={`https://suno.com/song/${currentId}`} target="_blank" rel="noopener noreferrer"
                style={{ ...button, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>Open song on Suno ↗</a>
            </div>
          </>
        ) : <p style={{ padding: "30px 15px", borderRadius: 12, background: "#edf4f1", color: "#577077" }}>No song added for this style yet. Paste its full Suno song link below.</p>}
        <div style={{ marginTop: 28, borderTop: "1px solid #e2ece7", paddingTop: 22 }}>
          <label htmlFor="suno-song-url" style={{ display: "block", fontWeight: 800, fontSize: 13, marginBottom: 9 }}>Add or replace the song for {selectedStyle.name}</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input id="suno-song-url" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="https://suno.com/song/…"
              style={{ flex: "1 1 280px", padding: "12px 13px", border: "1px solid #b8cbc6", borderRadius: 10, minWidth: 0 }} />
            <button type="button" onClick={saveSong} style={{ ...button, background: "#13766e", color: "#fff" }}>Load song</button>
          </div>
          {message && <p role="status" style={{ fontSize: 13, color: "#23645a", marginTop: 12 }}>{message}</p>}
          <p style={{ fontSize: 12, color: "#697d7f", marginTop: 12 }}>Tip: if Suno gives you a short link like suno.com/s/abc, open it first, then copy the redirected suno.com/song/… address. The embedded player is controlled by Suno, not by this test page.</p>
        </div>
      </section>
      <p style={{ fontSize: 13, color: "#65767b", marginTop: 22 }}>This test does not connect to Supabase, alter your game, or download any songs. Browsers may require a click inside the Suno player to start audio. Host-phone remote control, volume adjustment, autoplay, and continuous looping are NOT validated by this test.</p>
    </main>
  );
}
