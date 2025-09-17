import { WebSocketServer, WebSocket } from "ws";
import { parse } from "url";
import { IncomingMessage } from "http";
import { Server } from "http";
import jwt from "jsonwebtoken";
import { authenticateWebSocket } from "../middleware/auth";

interface DecodedToken {
  userId?: string;
  id?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

interface WebSocketWithUser extends WebSocket {
  user?: DecodedToken;
  role?: "chef" | "waiter";
  isAlive?: boolean;
}

const clients = {
  chef: new Set<WebSocketWithUser>(),
  waiter: new Set<WebSocketWithUser>(),
};

const heartbeatInterval = setInterval(() => {
  for (const role of ["chef", "waiter"] as const) {
    clients[role].forEach((ws) => {
      if (!ws.isAlive) {
        ws.terminate();
        clients[role].delete(ws);
        return;
      }

      ws.isAlive = false;
      ws.ping();
    });
  }
}, 30000);

export function initWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
  });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    const typedWs = ws as WebSocketWithUser;
    const { query } = parse(req.url || "", true);
    const token = query.token as string;
    const role = query.role as "chef" | "waiter";

    // Validate token and role
    if (!token) {
      typedWs.close(1008, "Authentication token required");
      return;
    }

    if (!role || !["chef", "waiter"].includes(role)) {
      typedWs.close(1008, "Invalid role specified");
      return;
    }

    try {
      const decoded = await authenticateWebSocket(token);
      typedWs.user = decoded;
      typedWs.role = role;
      typedWs.isAlive = true;

      // Rest of the code remains the same
    } catch (error: unknown) {
      console.error("WebSocket authentication failed:", error);
      typedWs.close(
        1008,
        error instanceof Error ? error.message : "Authentication failed"
      );
      return;
    }

    // Handle messages
    typedWs.on("message", (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleClientMessage(typedWs, message);
      } catch (error) {
        console.error("Error parsing message:", error);
        typedWs.send(
          JSON.stringify({
            type: "error",
            message: "Invalid message format",
          })
        );
      }
    });

    // Handle pong responses (for heartbeat)
    typedWs.on("pong", () => {
      typedWs.isAlive = true;
    });

    // Handle disconnection
    typedWs.on("close", (code, reason) => {
      const role = typedWs.role;
      if (role) {
        clients[role].delete(typedWs);
      }
      console.log(
        `Client disconnected: Code ${code}, Reason: ${reason.toString()}`
      );
    });

    // Handle errors
    typedWs.on("error", (error) => {
      console.error("WebSocket error:", error);
      const role = typedWs.role;
      if (role) {
        clients[role].delete(typedWs);
      }
    });
  });

  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  return wss;
}

function handleOrderCreated(
  ws: WebSocketWithUser,
  message: any,
  userId: string
) {
  const { order } = message;

  if (!order) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Missing order data in request",
      })
    );
    return;
  }

  console.log(`New order created: ${order._id} by ${userId}`);

  // Broadcast to all chef clients
  broadcastToAll({
    type: "order_created",
    order,
    createdBy: userId,
    timestamp: new Date().toISOString(),
  });

  // Send confirmation to waiter
  ws.send(
    JSON.stringify({
      type: "order_creation_confirmation",
      orderId: order._id,
      timestamp: new Date().toISOString(),
    })
  );
}

function handleClientMessage(ws: WebSocketWithUser, message: any) {
  const { role, user } = ws;

  if (!user || !role) {
    ws.close(1008, "Client metadata not found");
    return;
  }

  const userId = user.userId || user.id;
  console.log(`Received message from ${role} (${userId}):`, message.type);

  switch (message.type) {
    case "order_status_update":
      if (role === "chef") {
        handleOrderStatusUpdate(ws, message, userId as string);
      } else {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Only chef staff can update order status",
          })
        );
      }
      break;

    case "order_created":
      handleOrderCreated(ws, message, userId as string);
      break;

    case "ping":
      ws.send(JSON.stringify({ type: "pong" }));
      break;

    default:
      ws.send(
        JSON.stringify({
          type: "error",
          message: `Unknown message type: ${message.type}`,
        })
      );
  }
}

function handleOrderStatusUpdate(
  ws: WebSocketWithUser,
  message: any,
  userId: string
) {
  const { orderId, status } = message;

  if (!orderId || !status) {
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Missing orderId or status in request",
      })
    );
    return;
  }

  console.log(`Order status update: ${orderId} -> ${status} by ${userId}`);

  // Broadcast to all clients
  broadcastToAll({
    type: "orders_updated",
    orderId,
    status,
    updatedBy: userId,
    timestamp: new Date().toISOString(),
  });

  // Send confirmation
  ws.send(
    JSON.stringify({
      type: "order_status_update_confirmation",
      orderId,
      status,
      timestamp: new Date().toISOString(),
    })
  );
}

function broadcastToAll(message: any) {
  const messageStr = JSON.stringify(message);

  clients.chef.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });

  clients.waiter.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}
