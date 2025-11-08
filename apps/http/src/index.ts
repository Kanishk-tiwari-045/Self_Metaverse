import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes/v1/index';

const app = express();

// CORS middleware - Allow requests from frontend
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3001',
    ], // Allow frontend and any other services
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware for parsing JSON
app.use(express.json());

app.use('/api/v1', router);

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `HTTP server running on http://localhost:${process.env.PORT || 3000}`
  );
});
