-- Chainweb ownership and identity integrity foundation.
-- This artifact is intentionally not executed by application startup. Review
-- the legacy audit results before any environment applies these constraints.

ALTER TABLE IF EXISTS "referrals"
  ALTER COLUMN "chw_user_id" TYPE varchar(255)
  USING "chw_user_id"::text;

ALTER TABLE IF EXISTS "chw_visits"
  ALTER COLUMN "chw_user_id" TYPE varchar(255)
  USING "chw_user_id"::text;

ALTER TABLE IF EXISTS "benefits_screenings"
  ALTER COLUMN "referred_to_chw_id" TYPE varchar(255)
  USING "referred_to_chw_id"::text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chainweb_nodes_scenario_fk') THEN
    ALTER TABLE "chainweb_nodes" ADD CONSTRAINT "chainweb_nodes_scenario_fk"
      FOREIGN KEY ("scenario_id") REFERENCES "chainweb_scenarios"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chainweb_edges_scenario_fk') THEN
    ALTER TABLE "chainweb_edges" ADD CONSTRAINT "chainweb_edges_scenario_fk"
      FOREIGN KEY ("scenario_id") REFERENCES "chainweb_scenarios"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chainweb_edges_from_node_fk') THEN
    ALTER TABLE "chainweb_edges" ADD CONSTRAINT "chainweb_edges_from_node_fk"
      FOREIGN KEY ("from_node_id") REFERENCES "chainweb_nodes"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chainweb_edges_to_node_fk') THEN
    ALTER TABLE "chainweb_edges" ADD CONSTRAINT "chainweb_edges_to_node_fk"
      FOREIGN KEY ("to_node_id") REFERENCES "chainweb_nodes"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chainweb_calculations_scenario_fk') THEN
    ALTER TABLE "chainweb_calculations" ADD CONSTRAINT "chainweb_calculations_scenario_fk"
      FOREIGN KEY ("scenario_id") REFERENCES "chainweb_scenarios"("id") ON DELETE CASCADE NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chainweb_narratives_calculation_fk') THEN
    ALTER TABLE "chainweb_narratives" ADD CONSTRAINT "chainweb_narratives_calculation_fk"
      FOREIGN KEY ("calculation_id") REFERENCES "chainweb_calculations"("id") ON DELETE CASCADE NOT VALID;
  END IF;
END $$;

DO $$
DECLARE orphaned bigint;
BEGIN
  SELECT count(*) INTO orphaned FROM "chainweb_nodes" n
    LEFT JOIN "chainweb_scenarios" s ON s.id = n.scenario_id WHERE s.id IS NULL;
  IF orphaned > 0 THEN RAISE EXCEPTION 'Chainweb node integrity requires manual review of % orphaned rows', orphaned; END IF;
  SELECT count(*) INTO orphaned FROM "chainweb_edges" e
    LEFT JOIN "chainweb_scenarios" s ON s.id = e.scenario_id
    LEFT JOIN "chainweb_nodes" f ON f.id = e.from_node_id
    LEFT JOIN "chainweb_nodes" t ON t.id = e.to_node_id
    WHERE s.id IS NULL OR f.id IS NULL OR t.id IS NULL;
  IF orphaned > 0 THEN RAISE EXCEPTION 'Chainweb edge integrity requires manual review of % orphaned rows', orphaned; END IF;
  SELECT count(*) INTO orphaned FROM "chainweb_calculations" c
    LEFT JOIN "chainweb_scenarios" s ON s.id = c.scenario_id WHERE s.id IS NULL;
  IF orphaned > 0 THEN RAISE EXCEPTION 'Chainweb calculation integrity requires manual review of % orphaned rows', orphaned; END IF;
  SELECT count(*) INTO orphaned FROM "chainweb_narratives" n
    LEFT JOIN "chainweb_calculations" c ON c.id = n.calculation_id WHERE c.id IS NULL;
  IF orphaned > 0 THEN RAISE EXCEPTION 'Chainweb narrative integrity requires manual review of % orphaned rows', orphaned; END IF;
END $$;

ALTER TABLE "chainweb_nodes" VALIDATE CONSTRAINT "chainweb_nodes_scenario_fk";
ALTER TABLE "chainweb_edges" VALIDATE CONSTRAINT "chainweb_edges_scenario_fk";
ALTER TABLE "chainweb_edges" VALIDATE CONSTRAINT "chainweb_edges_from_node_fk";
ALTER TABLE "chainweb_edges" VALIDATE CONSTRAINT "chainweb_edges_to_node_fk";
ALTER TABLE "chainweb_calculations" VALIDATE CONSTRAINT "chainweb_calculations_scenario_fk";
ALTER TABLE "chainweb_narratives" VALIDATE CONSTRAINT "chainweb_narratives_calculation_fk";

CREATE INDEX IF NOT EXISTS "chainweb_scenarios_created_by_idx"
  ON "chainweb_scenarios" ("created_by");
CREATE INDEX IF NOT EXISTS "chainweb_nodes_scenario_idx"
  ON "chainweb_nodes" ("scenario_id");
CREATE INDEX IF NOT EXISTS "chainweb_edges_scenario_idx"
  ON "chainweb_edges" ("scenario_id");

DO $$
DECLARE duplicate_groups bigint;
BEGIN
  SELECT count(*) INTO duplicate_groups FROM (
    SELECT 1 FROM "chainweb_narratives"
    GROUP BY "calculation_id", "audience_type" HAVING count(*) > 1
  ) duplicates;
  IF duplicate_groups > 0 THEN
    RAISE EXCEPTION 'Chainweb narrative uniqueness requires manual review of % duplicate calculation/audience groups', duplicate_groups;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "chainweb_narratives_calculation_audience_uq"
  ON "chainweb_narratives" ("calculation_id", "audience_type");

DO $$
DECLARE duplicate_groups bigint;
BEGIN
  SELECT count(*) INTO duplicate_groups FROM (
    SELECT 1 FROM "chainweb_calculations" GROUP BY "scenario_id" HAVING count(*) > 1
  ) duplicates;
  IF duplicate_groups > 0 THEN
    RAISE EXCEPTION 'Chainweb calculation uniqueness requires manual review of % duplicate scenario groups', duplicate_groups;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "chainweb_calculations_scenario_uq"
  ON "chainweb_calculations" ("scenario_id");

-- Legacy ownership is intentionally only counted, never inferred, reassigned,
-- merged, or deleted. NULL and '0' rows require manual authoritative review.
DO $$
DECLARE unresolved bigint;
BEGIN
  SELECT count(*) INTO unresolved FROM "referrals"
    WHERE "chw_user_id" IS NULL OR "chw_user_id" = '0';
  RAISE NOTICE 'referrals unresolved legacy owner rows: %', unresolved;
  SELECT count(*) INTO unresolved FROM "chw_visits"
    WHERE "chw_user_id" IS NULL OR "chw_user_id" = '0';
  RAISE NOTICE 'chw_visits unresolved legacy owner rows: %', unresolved;
END $$;