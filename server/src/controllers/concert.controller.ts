import type { Response, NextFunction } from "express";

import { concertService } from "#services/concert.service.js";
import type { AuthenticatedRequest } from "#types/error.types.js";

export const getConcerts = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const concerts = await concertService.findAll();
    res.json({ success: true, data: concerts });
  } catch (error) {
    next(error);
  }
};

export const getConcertById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const concert = await concertService.findById(id);
    if (!concert) {
      res.status(404).json({ success: false, message: "Concert not found" });
      return;
    }
    res.json({ success: true, data: concert });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const tiers = await concertService.getAvailability(id);
    res.json({ success: true, data: tiers });
  } catch (error) {
    next(error);
  }
};
