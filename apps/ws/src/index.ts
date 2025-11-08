import dotenv from "dotenv";
// Load environment variables from .env file in project root
dotenv.config({ path: "../../.env" });

import { WebSocketServer } from 'ws';
import { User } from './User';
import { WS_PORT } from './config';

const wss = new WebSocketServer({ port: WS_PORT });

wss.on('connection', function connection(ws) {
  console.log("user connected")
  let user = new User(ws);
  ws.on('error', console.error);

  ws.on('close', () => {
    user?.destroy();
  });
});