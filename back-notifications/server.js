const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(bodyParser.json());
app.use(cors());

const notifications = [];

const sendNotificationToAll = (notification) => {
  notifications.push(notification);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  });
};

const createNotification = () => {
  const bodyNotification = {
    uuid: crypto.randomUUID(),
    title: "Notificación periódica",
    content:
      "Esta es una notificación enviada automáticamente cada 10 segundos.",
    viewed: false,
    timestamp: new Date().toISOString(),
  };
  return {
    ...bodyNotification,
    detail_notification: bodyNotification,
  };
};

setInterval(() => {
  const notification = createNotification();
  sendNotificationToAll(notification);
}, 10000);

app.get("/notifications", (req, res) => {
  res.json(notifications);
});

app.post("/mark-as-viewed", (req, res) => {
  const { uuid } = req.body;
  const notification = notifications.find((n) => n.uuid === uuid);
  if (notification) {
    notification.viewed = true;
    notification.detail_notification.viewed = true;
    res.status(200).send("Notificación marcada como vista");
  } else {
    res.status(404).send("Notificación no encontrada");
  }
});

// Manejar conexiones WebSocket
wss.on("connection", (ws) => {
  console.log("Nuevo cliente conectado");

  // Manejar mensajes entrantes
  ws.on("message", (message) => {
    // Mensaje recibido: <Buffer 70 72 75 65 62 61>
    console.log("Mensaje recibido:", message.toString());

    // "/notifications" > ws.send(JSON.stringify(notifications));
    // "/mark-as-viewed" > ws.send("Notificación marcada como vista");
  });

  ws.on("close", () => {
    console.log("Cliente desconectado");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en ws://localhost:${PORT}`);
});
