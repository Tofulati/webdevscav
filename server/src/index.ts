import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config({ path: '../.env' });

const app = createApp();
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🎮 WebDevScav server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
