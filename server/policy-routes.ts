import express from "express";
import { generateFullReport, aggregateSignals } from "./policy-signal-engine";

const policyRouter = express.Router();

policyRouter.get("/report", async (req: express.Request, res: express.Response) => {
  try {
    const geography = String(req.query.geography ?? "Travis County, TX");
    const countyFips = req.query.countyFips ? String(req.query.countyFips) : undefined;
    const report = await generateFullReport(geography, countyFips);
    res.json(report);
  } catch (err) {
    console.error("[policy-routes] GET /report", err);
    res.status(500).json({ error: "Failed to generate policy report" });
  }
});

policyRouter.get("/signals", async (req: express.Request, res: express.Response) => {
  try {
    const countyFips = req.query.countyFips ? String(req.query.countyFips) : undefined;
    const aggregates = await aggregateSignals({ countyFips });
    res.json(aggregates);
  } catch (err) {
    res.status(500).json({ error: "Failed to aggregate signals" });
  }
});

export { policyRouter };
