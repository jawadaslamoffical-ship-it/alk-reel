import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// ---------- Data types (build.py yahi format banata hai) ----------
export type ReelScene = {
  kind: "intro" | "product" | "features" | "end";
  vo: string; // voice file (public/ ke andar path)
  dur: number; // seconds
  caption: string;
  image?: string;
  title?: string;
  tag?: string;
};

export type ReelProps = {
  brand: string; // e.g. "Al Khaleej Al Thahabi"
  brandLines: string[]; // end card par bada naam, e.g. ["AL KHALEEJ", "AL THAHABI"]
  tagline: string; // end card upar, e.g. "COMPUTER PARTS & LAPTOPS"
  location: string;
  address: string;
  whatsapp: string;
  website: string;
  accent: string;
  music: string;
  headline: string[]; // intro bada text, e.g. ["GRAPHICS", "CARDS"]
  badge: string; // intro pill, e.g. "IN STOCK"
  checks: string[]; // product scene ke chhote badges
  features: string[]; // "Why buy from us" list
  strap: string; // end card neeche, e.g. "GRAPHICS CARDS IN STOCK NOW"
  images: string[];
  scenes: ReelScene[];
};

const FONT = "Inter, 'Inter Display', 'DejaVu Sans', sans-serif";
const BG = "#070B14";

const useEnter = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, stiffness: 120, mass: 0.7 } });
};

// Lambe text ke liye font size khud chhota ho jaye
const fit = (text: string, base: number, maxChars: number, min: number) => {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length), 1);
  const byWord = longest > 10 ? base * (10 / longest) : base;
  const byLen = text.length > maxChars ? base * Math.sqrt(maxChars / text.length) : base;
  return Math.max(min, Math.round(Math.min(byWord, byLen)));
};

const hex2 = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");

const Backdrop: React.FC<{ image?: string; accent: string }> = ({ image, accent }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(Math.sin(frame / 25), [-1, 1], [0.25, 0.45]);
  return (
    <AbsoluteFill style={{ background: BG }}>
      {image && (
        <Img
          src={staticFile(image)}
          style={{
            position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)",
            objectFit: "cover", filter: "blur(40px) brightness(0.35) saturate(1.2)",
          }}
        />
      )}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, ${accent}${hex2(glow)} 0%, transparent 55%)` }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(7,11,20,0.2) 0%, rgba(7,11,20,0.0) 40%, rgba(7,11,20,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};

const TopBar: React.FC<{ brand: string; accent: string }> = ({ brand, accent }) => (
  <div style={{ position: "absolute", top: 90, width: "100%", display: "flex", justifyContent: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: FONT, color: "white",
      fontSize: 34, fontWeight: 700, letterSpacing: 6 }}>
      <div style={{ width: 16, height: 16, borderRadius: 8, background: accent }} />
      {brand.toUpperCase()}
      <div style={{ width: 16, height: 16, borderRadius: 8, background: accent }} />
    </div>
  </div>
);

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const e = useEnter(4, 20);
  if (!text) return null;
  return (
    <div style={{ position: "absolute", bottom: 150, left: 70, right: 70, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: FONT, fontSize: 40, fontWeight: 600, color: "white", textAlign: "center",
        lineHeight: 1.3, background: "rgba(0,0,0,0.55)", padding: "18px 30px", borderRadius: 20,
        opacity: e, transform: `translateY(${(1 - e) * 20}px)` }}>
        {text}
      </div>
    </div>
  );
};

const Intro: React.FC<{ s: ReelScene; p: ReelProps }> = ({ s, p }) => {
  const frame = useCurrentFrame();
  const t1 = useEnter(0);
  const t2 = useEnter(8);
  const thumbs = p.images.slice(0, 4);
  const n = thumbs.length;
  const cols = n === 1 ? 1 : 2;
  const h = n === 1 ? 700 : n === 2 ? 600 : 340;
  const headSize = fit(p.headline.join(" "), 120, 16, 72);
  return (
    <AbsoluteFill>
      <Backdrop image={p.images[Math.min(2, n - 1)]} accent={p.accent} />
      <TopBar brand={p.brand} accent={p.accent} />
      <div style={{ position: "absolute", top: 260, width: "100%", textAlign: "center", fontFamily: FONT }}>
        {p.headline.map((line, i) => (
          <div key={i} style={{ fontSize: headSize, fontWeight: 900, color: "white", lineHeight: 1.05,
            transform: `scale(${0.6 + 0.4 * t1})`, opacity: t1 }}>{line}</div>
        ))}
        <div style={{ display: "inline-block", marginTop: 30, fontSize: 64, fontWeight: 900, color: BG,
          background: p.accent, padding: "10px 40px", borderRadius: 14, letterSpacing: 4,
          transform: `translateY(${(1 - t2) * 60}px)`, opacity: t2 }}>{p.badge}</div>
      </div>
      <div style={{ position: "absolute", top: 820, left: 60, right: 60, display: "grid",
        gridTemplateColumns: cols === 1 ? "1fr" : "1fr 1fr", gap: 28 }}>
        {thumbs.map((img, i) => {
          const e = spring({ frame: frame - 10 - i * 5, fps: 30, config: { damping: 12, stiffness: 140 } });
          return (
            <div key={img + i} style={{ height: h, borderRadius: 24, overflow: "hidden", border: `3px solid ${p.accent}55`,
              gridColumn: n === 3 && i === 2 ? "1 / span 2" : undefined,
              transform: `scale(${e}) rotate(${(1 - e) * (i % 2 ? 8 : -8)}deg)`, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
              <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          );
        })}
      </div>
      <Caption text={s.caption} />
    </AbsoluteFill>
  );
};

const Product: React.FC<{ s: ReelScene; p: ReelProps; index: number }> = ({ s, p, index }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const card = useEnter(0, 15);
  const title = useEnter(8);
  const tag = useEnter(14);
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08], { easing: Easing.inOut(Easing.quad) });
  const dir = index % 2 === 0 ? 1 : -1;
  const sheen = interpolate(frame, [10, 40], [-120, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleSize = fit(s.title || "", 92, 18, 56);
  return (
    <AbsoluteFill>
      <Backdrop image={s.image} accent={p.accent} />
      <TopBar brand={p.brand} accent={p.accent} />
      <div style={{ position: "absolute", top: 230, left: 40, right: 40, height: 750, borderRadius: 36, overflow: "hidden",
        transform: `translateX(${(1 - card) * 900 * dir}px) rotate(${(1 - card) * 6 * dir}deg)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 0 3px ${p.accent}66` }}>
        <Img src={staticFile(s.image!)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, width: 160, left: `${sheen}%`,
          background: "linear-gradient(100deg, transparent, rgba(255,255,255,0.25), transparent)", transform: "skewX(-15deg)" }} />
      </div>
      <div style={{ position: "absolute", top: 1030, width: "100%", textAlign: "center", fontFamily: FONT }}>
        {s.tag ? (
          <div style={{ display: "inline-block", fontSize: 38, fontWeight: 800, color: BG, background: p.accent,
            padding: "10px 28px", borderRadius: 999, letterSpacing: 3, opacity: tag,
            transform: `translateY(${(1 - tag) * 30}px)` }}>{s.tag}</div>
        ) : null}
        <div style={{ marginTop: 26, fontSize: titleSize, fontWeight: 900, color: "white", lineHeight: 1.05, padding: "0 50px",
          opacity: title, transform: `translateY(${(1 - title) * 50}px)`, textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>{s.title}</div>
        <div style={{ marginTop: 34, display: "flex", justifyContent: "center", gap: 22 }}>
          {p.checks.map((c, i) => {
            const e = spring({ frame: frame - 20 - i * 5, fps: 30, config: { damping: 14 } });
            return (
              <div key={c} style={{ fontSize: 34, fontWeight: 700, color: "white", border: `2px solid ${p.accent}`,
                padding: "10px 24px", borderRadius: 999, background: "rgba(0,0,0,0.35)", opacity: e,
                transform: `scale(${0.7 + 0.3 * e})` }}>✓ {c}</div>
            );
          })}
        </div>
      </div>
      <Caption text={s.caption} />
    </AbsoluteFill>
  );
};

const Features: React.FC<{ s: ReelScene; p: ReelProps }> = ({ s, p }) => {
  const frame = useCurrentFrame();
  const h = useEnter(0);
  return (
    <AbsoluteFill>
      <Backdrop image={p.images[p.images.length - 1]} accent={p.accent} />
      <TopBar brand={p.brand} accent={p.accent} />
      <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontFamily: FONT,
        fontSize: 86, fontWeight: 900, color: "white", opacity: h, transform: `scale(${0.8 + 0.2 * h})` }}>
        WHY BUY<br />FROM US?
      </div>
      <div style={{ position: "absolute", top: 640, left: 110, right: 110 }}>
        {p.features.map((it, i) => {
          const e = spring({ frame: frame - 8 - i * 7, fps: 30, config: { damping: 14, stiffness: 130 } });
          return (
            <div key={it} style={{ display: "flex", alignItems: "center", gap: 30, marginBottom: 44, fontFamily: FONT,
              opacity: e, transform: `translateX(${(1 - e) * -200}px)` }}>
              <div style={{ flex: "0 0 84px", width: 84, height: 84, borderRadius: 42, background: p.accent, display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 52, fontWeight: 900, color: BG }}>✓</div>
              <div style={{ fontSize: 56, fontWeight: 800, color: "white" }}>{it}</div>
            </div>
          );
        })}
      </div>
      <Caption text={s.caption} />
    </AbsoluteFill>
  );
};

const End: React.FC<{ s: ReelScene; p: ReelProps }> = ({ p }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const b = useEnter(10);
  const c = useEnter(18);
  const d = useEnter(26);
  const pulse = 1 + 0.04 * Math.sin(frame / 5);
  const thumbs = p.images.slice(0, 5);
  return (
    <AbsoluteFill>
      <Backdrop image={p.images[Math.min(2, p.images.length - 1)]} accent={p.accent} />
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: FONT }}>
        <div style={{ fontSize: 40, fontWeight: 700, color: p.accent, letterSpacing: 10, opacity: a }}>{p.tagline}</div>
        <div style={{ marginTop: 30, fontSize: 110, fontWeight: 900, color: "white", lineHeight: 1.0,
          opacity: a, transform: `scale(${0.7 + 0.3 * a})` }}>
          {p.brandLines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700, color: "white", opacity: b,
          transform: `translateY(${(1 - b) * 30}px)` }}>📍 {p.location}</div>
        <div style={{ marginTop: 14, fontSize: 36, fontWeight: 600, color: "#cfd6e4", opacity: b }}>{p.address}</div>
        <div style={{ marginTop: 70, display: "inline-flex", alignItems: "center", gap: 20, background: "#25D366",
          color: "white", fontSize: 54, fontWeight: 800, padding: "28px 56px", borderRadius: 999, opacity: c,
          transform: `scale(${c * pulse})`, boxShadow: "0 20px 60px rgba(37,211,102,0.45)" }}>
          WhatsApp {p.whatsapp}
        </div>
        {p.website ? (
          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", opacity: d,
            transform: `translateY(${(1 - d) * 30}px)` }}>
            <div style={{ fontSize: 46, fontWeight: 800, color: "white", padding: "16px 40px", borderRadius: 999,
              border: `3px solid ${p.accent}`, background: "rgba(0,0,0,0.4)" }}>
              🌐 {p.website}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{ position: "absolute", bottom: 170, left: 40, right: 40, display: "flex", gap: 14 }}>
        {thumbs.map((img, i) => {
          const e = spring({ frame: frame - 30 - i * 4, fps: 30, config: { damping: 13 } });
          return (
            <div key={img + i} style={{ flex: 1, height: 190, borderRadius: 18, overflow: "hidden",
              border: `2px solid ${p.accent}88`, opacity: e, transform: `translateY(${(1 - e) * 80}px)` }}>
              <Img src={staticFile(img)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", bottom: 100, width: "100%", textAlign: "center", fontFamily: FONT,
        fontSize: 34, fontWeight: 700, color: p.accent, letterSpacing: 6, opacity: c }}>{p.strap}</div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC<ReelProps> = (p) => {
  const { fps, durationInFrames } = useVideoConfig();
  let cursor = 0;
  let productIndex = 0;
  const musicVol = (f: number) =>
    interpolate(f, [0, 15, durationInFrames - 45, durationInFrames], [0, 0.16, 0.16, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: BG }}>
      {p.music ? <Audio src={staticFile(p.music)} volume={musicVol} loop /> : null}
      {p.scenes.map((s, i) => {
        const from = Math.round(cursor * fps);
        const len = Math.round(s.dur * fps);
        cursor += s.dur;
        const idx = s.kind === "product" ? productIndex++ : 0;
        return (
          <Sequence key={i} from={from} durationInFrames={len}>
            {s.kind === "intro" && <Intro s={s} p={p} />}
            {s.kind === "product" && <Product s={s} p={p} index={idx} />}
            {s.kind === "features" && <Features s={s} p={p} />}
            {s.kind === "end" && <End s={s} p={p} />}
            <Sequence from={6}>
              <Audio src={staticFile(s.vo)} volume={1} />
            </Sequence>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
