import cors from "cors";
import express from "express";

import { ENV } from "#config/env.config.js";
import { errorHandler, notFoundHandler } from "#middlewares/error/errorHandler.middleware.js";
import bookingRoutes from "#routes/booking.routes.js";
import concertRoutes from "#routes/concert.routes.js";

const app = express();

app.use(cors({ origin: ENV.CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/bookings", bookingRoutes);
app.use("/api/concerts", concertRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
