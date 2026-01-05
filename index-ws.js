const express = require("express");
const { get } = require("http");
const server = require("http").createServer();
const app = express();

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});

server.on("request", app);
server.listen(3000, () => {
  console.log("Server is listening on http://localhost:3000");
});

process.on("SIGINT", () => {
  console.log("\nShutting down...");
  wss.clients.forEach((client) => client.close());
  server.close(() => {
    console.log("Server closed.");
    shutdownDB();
    process.exit(0);
  });
});

// WebSocket setup
const WebSocketServer = require("ws").Server;
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const numClients = wss.clients.size;
  console.log(`New client connected. Total clients: ${numClients}`);

  wss.broadcast(`Current visitors: ${numClients}`);

  if (ws.readyState === ws.OPEN) {
    ws.send(`Welcome! Current visitors: ${numClients}`);
  }

  db.run(
    `INSERT INTO visitors (count, time) VALUES (${numClients}, datetime('now'))`
  );

  ws.on("close", () => {
    const numClients = wss.clients.size;
    console.log(`Client disconnected. Total clients: ${numClients}`);
    wss.broadcast(`Current visitors: ${numClients}`);
  });
});

wss.broadcast = function (data) {
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
};

// end websocket setup

// begin database setup
const sqlite = require("sqlite3");
const db = new sqlite.Database(":memory:");

db.serialize(() => {
  db.run(`
    CREATE TABLE visitors (
      count INTEGER,
      time TEXT
    )
  `);
});

function getCounts() {
  db.each("SELECT * FROM visitors", (err, row) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(row);
  });
}

function shutdownDB() {
  getCounts();
  console.log("Closed the database connection.");
  db.close();
}
