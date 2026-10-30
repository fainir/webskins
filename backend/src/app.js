import express from 'express';
import cors from 'cors';
import {skinsRouter,prisma} from './routes/skins.js';
import {actorFor} from './limits.js';
import {backupHealth} from './store.js';
import {fileURLToPath} from 'node:url';

export function createApp() {
 const app=express(),buckets=new Map();
 app.disable('x-powered-by');app.use(cors());app.use(express.json({limit:'256kb'}));
 // Owned public website only. No analytics is inserted into the extension or third-party pages.
 const websiteAssets = { '/': 'index.html', '/website.css': 'website.css', '/analytics.js': 'analytics.js', '/analytics.css': 'analytics.css' };
 for (const [route, file] of Object.entries(websiteAssets)) app.get(route, (_req,res) => res.set({ 'Cache-Control':'no-cache', 'Referrer-Policy':'no-referrer', 'X-Content-Type-Options':'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self' https://www.googletagmanager.com https://betterloopai.com; style-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://api.mixpanel.com https://betterloopai.com; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'; object-src 'none'" }).sendFile(fileURLToPath(new URL('../public/'+file,import.meta.url))));
 app.get('/analytics-config.json', (_req,res) => res.set('Cache-Control','no-store').json({gaId:process.env.GA_ID||'',mixpanelToken:process.env.MIXPANEL_TOKEN||'',betterloopKey:process.env.BETTERLOOP_KEY||''}));
 app.get('/privacy',(_req,res)=>res.set('Cache-Control','no-cache').sendFile(fileURLToPath(new URL('../public/privacy.html',import.meta.url))));
 app.get('/health',async(_req,res)=>{
  try{
   if(!process.env.RATE_LIMIT_SECRET)throw new Error('Missing rate configuration');
   await prisma.skin.findFirst({select:{id:true,manageKeyHash:true}});
   await prisma.metric.count();
   const backup=backupHealth();
   res.status(backup.ok?200:503).json({status:backup.ok?'ok':'degraded',service:'webskins-api',backup});
  }catch{res.status(503).json({status:'unavailable',service:'webskins-api'});}
 });
 app.use('/api',(req,res,next)=>{
  try{
   const now=Date.now(),actor=actorFor(req),key=actor+':'+(req.method==='GET'?'read':'write');
   let bucket=buckets.get(key);
   if(!bucket||bucket.reset<=now){bucket={count:0,reset:now+60000};if(buckets.size>=5000)buckets.delete(buckets.keys().next().value);buckets.set(key,bucket);}
   if(++bucket.count>(req.method==='GET'?120:30))return res.status(429).json({error:'Too many requests'});
   next();
  }catch{res.status(503).json({error:'Marketplace is unavailable'});}
 });
 app.use('/api/skins',skinsRouter);
 app.use((error,_req,res,_next)=>res.status(error.status===413?413:400).json({error:'Invalid request'}));
 return app;
}
