# PodWave — Simão & Marta

The PodWave dialogue editor, previews, acoustic controls and full WAV/MP3 export, connected to ElevenLabs. Simão reads male turns (SgbHvexvdPuvqzNjvbPM); Marta reads female turns (bBNhdwrIjl4fcVYiRbT2). No Python or local voice model is needed. These are the voice IDs supplied by the user; voice availability, accent and similarity to the Suno recording require live testing.

## Run on your computer
1. Install Node.js 22 or newer.
2. Open a terminal in this folder and run `npm install`.
3. Copy `.env.example` to `.env`. Set `ELEVENLABS_API_KEY=your_key` there, or configure that environment variable on the server. Never put a key in source code or GitHub.
4. Run `npm run dev` and open http://127.0.0.1:3000.
5. Test each voice, edit dialogue turns and render the podcast. Then play and download the complete WAV or MP3.

Generation sends the text to ElevenLabs and uses your account credits. Ensure the API key can access both voices. This edition uses eleven_multilingual_v2 for consistent voice identity. Accent comes from the selected voices; Portuguese text alone cannot guarantee a Portugal accent. No automatic paid request retries are made. Speech-to-text and AI writing controls are disabled in this edition.

For the closest voice baseline use pitch and speed 1, tone 0. Knobs change the generated audio during mixing; they are not voice cloning settings. Generation is limited to 4,000 characters per box. Every turn must render successfully before a complete podcast can be mixed. Listen before publishing; perfect voice identity and glitch-free speech are not guaranteed.

## GitHub and hosting
Upload this source folder without `.env`, `node_modules` or private recordings. GitHub Pages alone cannot run the server. This package binds to localhost and is intended for private local use. A public online version still needs server hosting, authentication and usage limits before exposing paid generation. No website has been deployed.

## Verification
Frontend build and TypeScript checks plus mocked API routing tests can run without a key. Live generation and audio quality are untested until a real account is configured.

API documentation: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
