import { Router } from 'express';
import crypto from 'node:crypto';
import {actorFor,dayNow,publicationAllowed,recordCounter} from '../limits.js';
import {sanitizeCss} from '../css-safety.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
export const skinsRouter = Router();

// Browse marketplace skins (with pagination, filtering, search)
skinsRouter.get('/', async (req, res) => {
  try {
    const {
      domain,
      search,
      sort = 'trending', // trending | newest | popular
      page = '1',
      limit = '20',
    } = req.query;

    const take = Math.max(1,Math.min(parseInt(limit) || 20, 50));
    if((domain && (typeof domain!=="string"||domain.length>255))||(search && (typeof search!=="string"||search.length>200)))return res.status(400).json({error:"Invalid filter"});
    const skip = (Math.min(1000,Math.max(parseInt(page) || 1, 1)) - 1) * take;

    const where = {};
    if (domain) where.domain = domain;
    if (search) {
      // SQLite's LIKE is already case-insensitive for ASCII text.
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { authorName: { contains: search } },
      ];
    }

    let orderBy;
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { installs: 'desc' };
        break;
      case 'trending':
      default:
        orderBy = { likes: 'desc' };
        break;
    }

    const [skins, total] = await Promise.all([
      prisma.skin.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          description: true,
          domain: true,
          authorName: true,
          thumbnail: true,
          likes: true,
          installs: true,
          createdAt: true,
        },
      }),
      prisma.skin.count({ where }),
    ]);

    res.json({
      skins,
      pagination: {
        page: Math.floor(skip / take) + 1,
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error('GET /api/skins error:', err);
    res.status(500).json({ error: 'Failed to fetch skins' });
  }
});

// Get a specific skin (full data including CSS)
skinsRouter.get('/:id', async (req, res) => {
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: req.params.id },
    });

    if (!skin) return res.status(404).json({ error: 'Skin not found' });

    const {manageKeyHash, ...visible}=skin;
    res.json({...visible,css:sanitizeCss(visible.css)});
  } catch (err) {
    console.error('GET /api/skins/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch skin' });
  }
});

// Publish a skin to the marketplace
skinsRouter.post('/', async (req, res) => {
  try {
    if(req.get('x-webskins-key-storage')!=='1')return res.status(426).json({error:'Update WebSkins before publishing so your private management key is retained'});
    const manageKey=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('authorization')??'')?.[1];
    if(!manageKey)return res.status(401).json({error:'Private skin management key required'});
    const { name, description, css, domain, prompt, authorName, authorId, thumbnail } = req.body;

    if (!name || !css || !domain || !authorName || !authorId) {
      return res.status(400).json({ error: 'Missing required fields: name, css, domain, authorName, authorId' });
    }

    if ([name,css,domain,authorName,authorId].some(v=>typeof v!=='string') ||
      name.length>120 || authorName.length>120 || authorId.length>120 || domain.length>255 ||
      Buffer.byteLength(css)>100000 || (description && (typeof description!=='string'||description.length>2000)) ||
      (prompt && (typeof prompt!=='string'||prompt.length>5000)) ||
      (thumbnail && (typeof thumbnail!=='string'||thumbnail.length>100000||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(thumbnail)))) {
      return res.status(400).json({error:'Skin fields exceed the supported sizes or format'});
    }
    const safeCss=sanitizeCss(css);
    if(!safeCss) return res.status(400).json({error:'No supported local CSS remains'});
    const manageKeyHash=crypto.createHash('sha256').update(manageKey).digest('hex');
    const actor=actorFor(req),day=dayNow();
    const skin=await prisma.$transaction(async tx=>{
    if(!await publicationAllowed(tx,actor,day))return null;
    const created=await tx.skin.create({
      data: {
        name,
        description: description || null,
        css:safeCss,
        manageKeyHash,
        domain,
        prompt: prompt || null,
        authorName,
        authorId,
        thumbnail: thumbnail || null,
      },
    });

    await tx.metric.create({data:{skinId:created.id,kind:'publish',actor,day}});
    return created;
    });
    if(!skin)return res.status(429).json({error:'Publication or storage limit reached'});
    const {manageKeyHash: omitted, ...visible}=skin;
    res.status(201).json(visible);
  } catch (err) {
    console.error('POST /api/skins error:', err);
    res.status(500).json({ error: 'Failed to publish skin' });
  }
});

// Delete a skin (only by author)
skinsRouter.delete('/:id', async (req, res) => {
  try {
    const token=/^Bearer ([A-Za-z0-9_-]{43})$/.exec(req.get('authorization')??'')?.[1];
    if(!token) return res.status(401).json({error:'Private skin management key required'});

    const skin = await prisma.skin.findUnique({ where: { id: req.params.id } });
    if (!skin) return res.status(404).json({ error: 'Skin not found' });
    if(!skin.manageKeyHash) return res.status(409).json({error:'Legacy skin ownership needs operator review'});
    const digest=crypto.createHash('sha256').update(token).digest('hex');
    if(!crypto.timingSafeEqual(Buffer.from(skin.manageKeyHash,'hex'),Buffer.from(digest,'hex'))) return res.status(403).json({error:'Not authorized'});

    await prisma.skin.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/skins/:id error:', err);
    res.status(500).json({ error: 'Failed to delete skin' });
  }
});

// Counts are per network/day; public IDs are never proof of a unique voter.
skinsRouter.post('/:id/like', async (req,res)=>{
  try {
    const skin=await recordCounter(prisma,req.params.id,'like',actorFor(req));
    if(!skin)return res.status(404).json({error:'Skin not found'});
    res.json({id:skin.id,likes:skin.likes});
  } catch {res.status(503).json({error:'Like could not be recorded'});}
});
skinsRouter.post('/:id/install', async (req,res)=>{
  try {
    const skin=await recordCounter(prisma,req.params.id,'install',actorFor(req));
    if(!skin)return res.status(404).json({error:'Skin not found'});
    res.json({id:skin.id,installs:skin.installs,css:sanitizeCss(skin.css),name:skin.name,domain:skin.domain});
  } catch {res.status(503).json({error:'Install could not be recorded'});}
});
