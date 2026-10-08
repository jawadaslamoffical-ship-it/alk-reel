# Al Khaleej Al Thahabi: Auto Reel Renderer

Product photos + chand lines do, 30-40 sec ki vertical reel (1080x1920) khud ban jati hai:
English voice (Piper, free), music, animation, end card par **WhatsApp +971 56 256 3696** aur **alkhaleejalthahabi.com**.

Render **GitHub Actions** par hota hai: free, VPS ki zaroorat nahi. Public repo ke liye minutes unlimited hain.

## Ek dafa ka setup (15 minute)

1. **GitHub account** banayein (github.com, Sign up). Account pehle se ho to wahi chalega.
2. **Naya repo:** New repository, naam `alk-reel`, **Public** select karein, phir Create.
3. **Files upload:** repo page par "uploading an existing file" par click karein. Is zip ki **saari files aur folders** (`.github` folder samait) drag karke daal dein, phir "Commit changes".
   - Check karein ke repo mein `.github/workflows/render.yml` nazar aa raha ho. Na ho to Add file, Create new file, naam `.github/workflows/render.yml`, aur file ka content paste kar dein.
4. **Token (n8n ke liye):** GitHub par Settings, Developer settings, Personal access tokens, **Fine-grained tokens**, Generate.
   - Repository access: *Only select repositories*, phir `alk-reel`.
   - Permissions: **Actions: Read and write**.
   - Token copy karke rakh lein (sirf ek dafa dikhta hai).
5. **Variable (repo ke andar):** Settings, Secrets and variables, Actions, **Variables** tab, New repository variable:
   - `N8N_CALLBACK_URL` = `https://alkhaleejalthabi.app.n8n.cloud/webhook/reel-done`

## n8n mein

Dono n8n workflows (alag se diye gaye hain, repo mein nahi rakhe kyunki un mein token hain) import karein:

| File | Kya karta hai | Kya badalna hai |
|---|---|---|
| `Reel_1_Render_Test.json` | Sample job GitHub ko bhejta hai | "Job banao" node mein `GITHUB_OWNER`, aur HTTP node mein `APNA_GITHUB_TOKEN` |
| `Reel_2_Render_Done_WhatsApp.json` | Video ban jaye to WhatsApp par bhejta hai | "Check" node mein `SEND_TO` number. Phir workflow **Activate** karein |

Import ke baad "UltraMsg bhejo" node khol kar Body Content Type **Form Urlencoded** dobara select kar lein (n8n import par kabhi kabhi ye reset ho jata hai).

Test: workflow 1 mein "Execute workflow" chalayein. 5 se 8 minute mein reel aap ke WhatsApp par aa jayegi.
Progress dekhne ke liye GitHub repo ka **Actions** tab kholein.

## Job format (n8n yahi bhejta hai)

```json
{
  "id": "2026-10-09-am",
  "headline": ["GRAPHICS", "CARDS"],
  "intro_vo": "Looking for a graphics card in the UAE?",
  "strap": "GRAPHICS CARDS IN STOCK NOW",
  "products": [
    { "image": "https://...jpg", "title": "GT 710 2GB", "tag": "Budget • Silent",
      "caption": "Screen par chhota text", "vo": "Jo awaaz bolegi (numbers spelled: G T seven ten)" }
  ],
  "post": { "caption": "Social media caption (wapas mil jata hai)" }
}
```

Optional: `badge`, `features`, `features_vo`, `end_vo`, `show_features` (false = "Why buy" scene hata do), `speed` (0.92 normal, chhota = tez).
Brand, number, website aur address `pipeline/brand.json` mein hain. Wahan ek dafa badlo, har video mein badal jayega.

## Apne computer ya VPS par chalana (optional)

```bash
npm ci && pip install piper-tts==1.8.0
mkdir -p voices && cd voices && curl -sSLO https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz && tar xzf *.tar.gz && cd ..
python3 pipeline/build.py jobs/sample.json      # out/sample-gpu.mp4
```
