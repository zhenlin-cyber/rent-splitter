Figma export bundle

Included:
- `svgs/` — vector assets from the project (editable in Figma)

How to create a full-page PNG screenshot for Figma:
1. Run the dev server locally:

   npm run dev

2. Open http://localhost:5173 in Chrome.
3. Open DevTools (Cmd+Option+I) → Cmd+Shift+P → type "Capture full size screenshot" → press Enter.
4. Save the generated PNG and import it into Figma (File → Place Image).

How to import the live page into Figma (HTML → Figma plugin):
1. Make your local server public (example with localtunnel):

   npx localtunnel --port 5173

2. Copy the public URL printed by localtunnel.
3. In Figma, install and open the "HTML to Figma" plugin and paste the public URL.

Notes:
- Many UI graphics are rendered via React (lucide-react). Those are inline SVGs created at runtime and are not available as separate files unless you export them from the app or replace them with static SVG files in `src/assets/`.
- If you want, I can attempt an automated full-page screenshot using a headless browser (adds dependencies). Say "go ahead" and I'll create the PNG automatically and add it to `figma-export/`.