import dotenv from 'dotenv';
import { createApp } from '../server/src/app.js';

dotenv.config();

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}
