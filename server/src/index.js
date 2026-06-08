import { createApp } from './app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 8787);
const app = createApp();

app.listen(PORT, () => console.log(`Coffee Estate API running on http://localhost:${PORT}`));
