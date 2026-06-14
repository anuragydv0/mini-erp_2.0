import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

import productRoutes from "./routes/product.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import stockLedgerRoutes from "./routes/stockLedger.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import salesOrderRoutes from "./routes/salesOrder.routes.js";
import purchaseOrderRoutes from "./routes/purchaseOrder.routes.js";
import manufacturingOrderRoutes from "./routes/manufacturingOrder.routes.js";
import bomRoutes from "./routes/bom.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import auditRoutes from "./routes/audit.route.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (req, res) => {
  res.send("API is running...");
});

// API Routes
app.use("/api/products", productRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/stock-ledger", stockLedgerRoutes); // matched to frontend fetch
app.use("/api/stockLedger", stockLedgerRoutes); // legacy
app.use("/api/categories", categoryRoutes);
app.use("/api/sales", salesOrderRoutes);
app.use("/api/purchase", purchaseOrderRoutes);
app.use("/api/manufacturing", manufacturingOrderRoutes);
app.use("/api/boms", bomRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});