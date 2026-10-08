import express from 'express';
import 'dotenv/config';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const app=express();
const voices={male:{id:'SgbHvexvdPuvqzNjvbPM',name:'Simão'},female:{id:'bBNhdwrIjl4fcVYiRbT2',name:'Marta'}};
app.use(express.json({limit:'100kb'}));
let busy=false;
app.get('/api/status',(req,res)=>res.json({status:'ok',hasVoiceServiceKey:Boolean(process.env.ELEVENLABS_API_KEY),voices}));
app.post('/api/tts/generate-segment',async(req,res)=>{
 const origin=req.headers.origin;
 if(origin && origin!==`http://${req.headers.host}`)return res.status(403).json({error:'Open the app on this server.'});
 if(!process.env.ELEVENLABS_API_KEY)return res.status(503).json({error:'Add ELEVENLABS_API_KEY to the server .env file and restart the app.'});
 const {text,speaker}=req.body;
 if(typeof text!=='string'||!text.trim()||text.length>4000||!Object.hasOwn(voices,speaker))return res.status(400).json({error:'Choose a speaker and use 1–4,000 characters per text box.'});
 if(busy)return res.status(409).json({error:'A voice is rendering. Wait for it to finish.'});
 busy=true;
 try{
  const r=await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voices[speaker].id}?output_format=mp3_44100_128`,{method:'POST',headers:{'Content-Type':'application/json','xi-api-key':process.env.ELEVENLABS_API_KEY},body:JSON.stringify({text:text.trim(),model_id:'eleven_multilingual_v2',voice_settings:{stability:0.5,similarity_boost:0.85,style:0.25,use_speaker_boost:true}}),signal:AbortSignal.timeout(180000)});
  if(!r.ok)return res.status(502).json({error:`ElevenLabs returned ${r.status}. Check credits, voice access and API-key permissions. No automatic retry was made.`});
  const audio=Buffer.from(await r.arrayBuffer());
  if(!audio.length||!r.headers.get('content-type')?.includes('audio'))return res.status(502).json({error:'The voice service did not return playable audio.'});
  res.json({audioBase64:audio.toString('base64'),mimeType:'audio/mpeg',voiceName:voices[speaker].name});
 }catch{res.status(503).json({error:'Voice generation failed or timed out. Check your ElevenLabs history before retrying; credits may have been used.'});}
 finally{busy=false;}
});
app.use('/api',(req,res)=>res.status(404).json({error:'This edition supports speech generation and podcast export.'}));
if(process.env.NODE_ENV==='production'){
 app.use(express.static(path.join(root,'dist')));
 app.get('*',(req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}else{
 const {createServer}=await import('vite');
 const vite=await createServer({server:{middlewareMode:true},appType:'spa'});
 app.use(vite.middlewares);
}
app.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('PodWave: http://127.0.0.1:'+(process.env.PORT||3000)));
