import cors from "cors";
import express from "express";

import { ENV } from "#config/env.config.js";
import { errorHandler, notFoundHandler } from "#middlewares/error/errorHandler.middleware.js";
import { bookingRouter, concertRouter } from "#routes/index";

const app = express();

app.use(cors({ origin: ENV.CLIENT_URL }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/bookings", bookingRouter);
app.use("/api/concerts", concertRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
