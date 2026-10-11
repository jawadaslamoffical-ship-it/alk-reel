#!/usr/bin/env python3
"""
Al Khaleej reel builder.
  job.json  ->  photos download  ->  Piper voices  ->  props.json  ->  Remotion render  ->  out/reel.mp4

Usage:
  python3 pipeline/build.py jobs/sample.json            # file se
  python3 pipeline/build.py --json '{"products":[...]}'  # seedha JSON string (GitHub Actions)

Env (optional):
  PIPER_VOICE          default: voices/en-us-ryan-high.onnx
  BROWSER_EXECUTABLE   Chrome headless shell ka path (agar Remotion ka apna download nahi chahiye)
  CONCURRENCY          Remotion render threads
"""
import json, os, re, shutil, subprocess, sys, urllib.request, wave

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(ROOT, "out")
FPS = 30
VO_DELAY = 6 / FPS      # Reel.tsx har scene mein voice 6 frame baad shuru karta hai
GAP = 0.7               # voice ke baad saans
END_GAP = 1.8           # end card par zyada der ruko


def log(*a):
    print("[build]", *a, flush=True)


def load_job():
    if len(sys.argv) >= 3 and sys.argv[1] == "--json":
        return json.loads(sys.argv[2])
    if len(sys.argv) >= 2:
        with open(sys.argv[1], encoding="utf-8") as f:
            return json.load(f)
    raise SystemExit("job file ya --json do")


def safe_id(s):
    return re.sub(r"[^A-Za-z0-9_-]+", "-", str(s)).strip("-")[:60] or "reel"


def fetch_image(src, dest, job_dir):
    """URL ya local path -> 1200px JPG"""
    raw = dest + ".src"
    if re.match(r"^https?://", src):
        req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0 alk-reel"})
        with urllib.request.urlopen(req, timeout=60) as r, open(raw, "wb") as f:
            shutil.copyfileobj(r, f)
    else:
        p = src if os.path.isabs(src) else os.path.join(job_dir, src)
        shutil.copy(p, raw)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-frames:v", "1",
                    "-vf", "scale='min(1200,iw)':-2", "-q:v", "3", dest], check=True)
    os.remove(raw)


ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def two(n):
    if n < 20:
        return ONES[n]
    return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])


def num_words(n):
    """2133 -> twenty one thirty three, 2400 -> twenty four hundred, 512 -> five twelve"""
    if n < 100:
        return two(n)
    if n < 1000:
        return ONES[n // 100] + (" hundred" if n % 100 == 0 else " " + ("oh " + ONES[n % 100] if n % 100 < 10 else two(n % 100)))
    if n < 10000:
        hi, lo = divmod(n, 100)
        if lo == 0:
            return two(hi) + " hundred" if hi % 10 else two(hi // 10) + " thousand"
        return two(hi) + " " + ("oh " + ONES[lo] if lo < 10 else two(lo))
    return str(n)


def letters(s):
    return " ".join(s.upper())


def tech_speech(t):
    t = re.sub(r"(\d+)\s*(GB|gb|Gb)\b", lambda m: num_words(int(m.group(1))) + " G B", t)
    t = re.sub(r"(\d+)\s*(TB|tb)\b", lambda m: num_words(int(m.group(1))) + " T B", t)
    t = re.sub(r"(\d+)\s*(MHz|mhz|Mhz)\b", lambda m: num_words(int(m.group(1))) + " megahertz", t)
    t = re.sub(r"(\d+)\s*(GHz|ghz)\b", lambda m: m.group(1).replace(".", " point ") + " gigahertz", t)
    t = re.sub(r"\b(DDR|PC|LPDDR)(\d)\b", lambda m: letters(m.group(1)) + " " + ONES[int(m.group(2))], t, flags=re.I)
    t = re.sub(r"\b(SSD|HDD|GPU|CPU|RAM|NVMe|M\.2|USB|HDMI|RTX|GTX|GT|AMD|HP|PC)\b",
               lambda m: {"RAM": "ram", "NVMe": "N V M E", "M.2": "M two"}.get(m.group(1), letters(m.group(1))), t)
    t = re.sub(r"\b([iI])([3579])\b", lambda m: "i " + ONES[int(m.group(2))], t)
    t = re.sub(r"\b(\d{3,4})\b", lambda m: num_words(int(m.group(1))), t)
    return t


def speech_text(text, say_as):
    for k, v in say_as.items():
        text = re.sub(re.escape(k), v, text, flags=re.I)
    return tech_speech(text)


def wav_len(path):
    with wave.open(path) as w:
        return w.getnframes() / float(w.getframerate())


def main():
    job = load_job()
    job_dir = os.path.dirname(os.path.abspath(sys.argv[1])) if len(sys.argv) == 2 else ROOT
    with open(os.path.join(ROOT, "pipeline", "brand.json"), encoding="utf-8") as f:
        brand = json.load(f)
    cfg = {**brand, **{k: v for k, v in job.items() if v not in (None, "", [])}}

    products = job.get("products") or []
    if not products:
        raise SystemExit("products khali hain")
    jid = safe_id(job.get("id", "reel"))
    rel = f"job/{jid}"
    jdir = os.path.join(PUBLIC, "job")
    shutil.rmtree(jdir, ignore_errors=True)
    os.makedirs(os.path.join(PUBLIC, rel), exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    # 1. Photos
    images = []
    for i, p in enumerate(products):
        name = f"{rel}/p{i}.jpg"
        log("photo", i, p["image"][:80])
        fetch_image(p["image"], os.path.join(PUBLIC, name), job_dir)
        images.append(name)

    # 2. Script (scene list)
    scenes = [{"kind": "intro", "say": cfg.get("intro_vo") or "New stock just arrived in the U A E.",
               "caption": cfg.get("intro_caption") or cfg.get("intro_vo") or ""}]
    for i, p in enumerate(products):
        scenes.append({"kind": "product", "say": p.get("vo") or p["title"], "image": images[i],
                       "title": p["title"], "tag": (p.get("tag") or "").upper(), "caption": p.get("caption", "")})
    if cfg.get("show_features", True):
        scenes.append({"kind": "features", "say": cfg["features_vo"], "caption": cfg["features_caption"]})
    scenes.append({"kind": "end", "say": cfg["end_vo"], "caption": ""})

    # 3. Voices (Piper)
    from piper import PiperVoice
    from piper.config import SynthesisConfig
    voice_path = os.environ.get("PIPER_VOICE", os.path.join(ROOT, "voices", "en-us-ryan-high.onnx"))
    voice = PiperVoice.load(voice_path)
    syn = SynthesisConfig(length_scale=float(cfg.get("speed", 0.92)))
    for i, s in enumerate(scenes):
        vo = f"{rel}/vo{i}.wav"
        path = os.path.join(PUBLIC, vo)
        with wave.open(path, "wb") as w:
            voice.synthesize_wav(speech_text(s.pop("say"), cfg.get("say_as", {})), w, syn_config=syn)
        length = wav_len(path)
        s["vo"] = vo
        s["dur"] = round(length + VO_DELAY + (END_GAP if s["kind"] == "end" else GAP), 2)
        log(f"vo{i} {s['kind']:8s} {length:5.2f}s -> scene {s['dur']}s")

    # 4. props.json
    keys = ["brand", "brandLines", "tagline", "location", "address", "whatsapp", "website", "accent",
            "music", "badge", "checks", "features", "strap"]
    props = {k: cfg[k] for k in keys}
    props["headline"] = cfg.get("headline") or ["NEW", "STOCK"]
    props["images"] = images
    props["scenes"] = scenes
    with open(os.path.join(OUT, "props.json"), "w", encoding="utf-8") as f:
        json.dump(props, f, ensure_ascii=False, indent=1)
    total = sum(s["dur"] for s in scenes)
    log(f"total {total:.1f}s, {len(scenes)} scenes")

    # 5. Render
    out_mp4 = os.path.join(OUT, f"{jid}.mp4")
    cmd = ["npx", "remotion", "render", "src/index.tsx", "Reel", out_mp4,
           "--props=out/props.json", "--codec=h264", "--crf=20", "--log=error"]
    if os.environ.get("BROWSER_EXECUTABLE"):
        cmd.append(f"--browser-executable={os.environ['BROWSER_EXECUTABLE']}")
    if os.environ.get("CONCURRENCY"):
        cmd.append(f"--concurrency={os.environ['CONCURRENCY']}")
    log("render ...")
    subprocess.run(cmd, cwd=ROOT, check=True)

    # 6. WhatsApp 16 MB se badi video nahi leta -> zarurat ho to chhota karo (max ~14 MB)
    limit = 14 * 1024 * 1024
    size = os.path.getsize(out_mp4)
    if size > limit:
        kbps = int((limit * 8 / 1024) / total * 0.92) - 128   # audio 128k
        log(f"size {size/1e6:.1f} MB -> compress to ~{kbps} kbps")
        tmp = out_mp4 + ".tmp.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out_mp4, "-c:v", "libx264", "-preset", "medium",
                        "-b:v", f"{kbps}k", "-maxrate", f"{int(kbps*1.3)}k", "-bufsize", f"{kbps*2}k",
                        "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", tmp], check=True)
        os.replace(tmp, out_mp4)
        log(f"new size {os.path.getsize(out_mp4)/1e6:.1f} MB")

    result = {"id": jid, "file": out_mp4, "duration": round(total, 2),
              "products": [p["title"] for p in products],
              "post": job.get("post", {})}
    with open(os.path.join(OUT, "result.json"), "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=1)
    log("done", out_mp4)


if __name__ == "__main__":
    main()
