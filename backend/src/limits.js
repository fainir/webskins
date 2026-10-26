import crypto from 'node:crypto';
import {isIP} from 'node:net';

export function actorFor(req) {
  const secret=process.env.RATE_LIMIT_SECRET;
  if(!secret)throw new Error('Marketplace rate control is not configured');
  const forwarded=req.get('x-real-ip');
  const ip=process.env.RAILWAY_ENVIRONMENT_ID && isIP(forwarded??'') ? forwarded : req.socket.remoteAddress;
  return crypto.createHmac('sha256',secret).update(ip??'unknown').digest('hex');
}
export const dayNow=()=>new Date().toISOString().slice(0,10);

export async function publicationAllowed(tx,actor,day) {
  const [personal,total,storage]=await Promise.all([
    tx.metric.count({where:{kind:'publish',actor,day}}),
    tx.metric.count({where:{kind:'publish',day}}),
    tx.skin.count(),
  ]);
  return personal<10 && total<250 && storage<10000;
}

/** INSERT OR IGNORE and the counter update share the same database transaction. */
export async function recordCounter(prisma,skinId,kind,actor) {
  const day=dayNow(),id=crypto.randomUUID();
  return prisma.$transaction(async tx=>{
    if(!await tx.skin.findUnique({where:{id:skinId},select:{id:true}}))return null;
    const count=await tx.metric.count();
    if(count>=200000)throw new Error('Metric storage limit reached');
    const inserted=await tx.$executeRaw`INSERT OR IGNORE INTO Metric (id,skinId,kind,actor,day) VALUES (${id},${skinId},${kind},${actor},${day})`;
    return inserted ? tx.skin.update({where:{id:skinId},data:{[kind==='like'?'likes':'installs']:{increment:1}}})
      : tx.skin.findUnique({where:{id:skinId}});
  });
}
