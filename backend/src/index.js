import {createApp} from './app.js';
import {initializeStore,backupStore} from './store.js';
import {prisma} from './routes/skins.js';
try {
  await initializeStore();
  const server=createApp().listen(process.env.PORT||3000,'0.0.0.0',()=>console.log('WebSkins API ready'));
  const timer=setInterval(()=>{void backupStore().catch(()=>console.error('Marketplace backup failed'));},24*60*60*1000);timer.unref();
  // Keep daily quota evidence bounded without clearing current-day limits.
  const cutoff=new Date(Date.now()-90*24*60*60*1000).toISOString().slice(0,10);
  await prisma.metric.deleteMany({where:{day:{lt:cutoff}}});
  process.once('SIGTERM',()=>{clearInterval(timer);server.close(()=>{void prisma.$disconnect().finally(()=>process.exit(0));});});
} catch {console.error('Marketplace database/config initialization failed; server not started');process.exit(1);}
