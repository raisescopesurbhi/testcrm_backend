const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/user/UserDb.js");

const authRoutes = require("./routes/authRoutes.js");
const adminRoutes = require("./routes/AdminRoutes.js");
const metaRoutes = require("./routes/metaRoutes");
const superadminRoutes = require("./routes/SuperadminRoutes.js");
const userRoutes = require("./routes/UserRoutes.js");

const requireUser = require("./middlewares/requireUser.js");
const requireAdmin = require("./middlewares/requireAdmin.js");
const requireUserRefresh = require("./middlewares/requireUserRefresh.js");
const requireSuperadmin = require("./middlewares/requireSuperadmin.js");
const requireAdminRefresh = require("./middlewares/requireAdminRefresh.js");

const copyRoutes = require("./routes/copyRoutes.js");
const copyRatingRoutes = require("./routes/copyRatingRoutes.js");
const copierRoutes = require("./routes/copierRoutes.js");
const tradeRoutes = require("./routes/tradeRoutes.js");
const adminmasterRoutes = require("./routes/adminmasterRoutes.js");
const admincopierRoutes = require("./routes/admincopierRoutes.js");

dotenv.config();

require("./cron/ibCron.js");
require("./utils/apiClients");
require("./cron/tradesCron.js");

connectDB();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || "https://sucrm.testcrm.co.in",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Api-Key"],
  }),
);

app.options("*", cors());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinUserTicket", (loggedUser) => {
    socket.join(loggedUser);
    console.log(`Socket ${socket.id} joined room ${loggedUser}`);
  });

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room: ${roomId}`);
  });

  socket.on("joinTicket", (ticketId) => {
    socket.join(ticketId);
    console.log(`Socket ${socket.id} joined room ${ticketId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.set("io", io);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: `Hello pixel, ${process.env.WEBSITE_NAME || "Server"}`,
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is running",
    time: new Date().toISOString(),
  });
});

app.use("/api/meta", metaRoutes);
app.use("/api/s-admin", superadminRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/client", userRoutes);
app.use("/api/copy-trading", copyRoutes);
app.use("/api/copy-rating", copyRatingRoutes);
app.use("/api/copier", copierRoutes);
app.use("/api/copytrade", tradeRoutes);
app.use("/api/masteradmin", adminmasterRoutes);
app.use("/api/copieradmin", admincopierRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/user-me", requireUser);
app.get("/api/admin-me", requireAdmin);
app.get("/api/superadmin-me", requireSuperadmin);

app.post("/api/user-refresh", requireUserRefresh);
app.post("/api/admin-refresh", requireAdminRefresh);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => {
  console.error("Global error:", err);

  if (err.message && err.message.startsWith("CORS blocked")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
