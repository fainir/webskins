import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { skinsRouter } from './routes/skins.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webskins-api' });
});

// Routes
app.use('/api/skins', skinsRouter);

// Start server first, then migrate DB in background
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSkins API running on port ${PORT}`);

  // Run prisma db push in background after server starts
  try {
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit', timeout: 30000 });
    console.log('Database schema synced');
  } catch (err) {
    console.error('DB sync failed (will retry on next deploy):', err.message);
  }
});
