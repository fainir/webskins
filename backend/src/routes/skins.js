import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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

    const take = Math.min(parseInt(limit) || 20, 50);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const where = {};
    if (domain) where.domain = domain;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { authorName: { contains: search, mode: 'insensitive' } },
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

    res.json(skin);
  } catch (err) {
    console.error('GET /api/skins/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch skin' });
  }
});

// Publish a skin to the marketplace
skinsRouter.post('/', async (req, res) => {
  try {
    const { name, description, css, domain, prompt, authorName, authorId, thumbnail } = req.body;

    if (!name || !css || !domain || !authorName || !authorId) {
      return res.status(400).json({ error: 'Missing required fields: name, css, domain, authorName, authorId' });
    }

    const skin = await prisma.skin.create({
      data: {
        name,
        description: description || null,
        css,
        domain,
        prompt: prompt || null,
        authorName,
        authorId,
        thumbnail: thumbnail || null,
      },
    });

    res.status(201).json(skin);
  } catch (err) {
    console.error('POST /api/skins error:', err);
    res.status(500).json({ error: 'Failed to publish skin' });
  }
});

// Delete a skin (only by author)
skinsRouter.delete('/:id', async (req, res) => {
  try {
    const { authorId } = req.body;
    if (!authorId) return res.status(400).json({ error: 'authorId required' });

    const skin = await prisma.skin.findUnique({ where: { id: req.params.id } });
    if (!skin) return res.status(404).json({ error: 'Skin not found' });
    if (skin.authorId !== authorId) return res.status(403).json({ error: 'Not authorized' });

    await prisma.skin.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/skins/:id error:', err);
    res.status(500).json({ error: 'Failed to delete skin' });
  }
});

// Like a skin
skinsRouter.post('/:id/like', async (req, res) => {
  try {
    const skin = await prisma.skin.update({
      where: { id: req.params.id },
      data: { likes: { increment: 1 } },
      select: { id: true, likes: true },
    });

    res.json(skin);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Skin not found' });
    console.error('POST /api/skins/:id/like error:', err);
    res.status(500).json({ error: 'Failed to like skin' });
  }
});

// Track install
skinsRouter.post('/:id/install', async (req, res) => {
  try {
    const skin = await prisma.skin.update({
      where: { id: req.params.id },
      data: { installs: { increment: 1 } },
      select: { id: true, installs: true, css: true, name: true, domain: true },
    });

    res.json(skin);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Skin not found' });
    console.error('POST /api/skins/:id/install error:', err);
    res.status(500).json({ error: 'Failed to install skin' });
  }
});
