-- Community Gravity ("Magnet"): who's who doing the work in a community, from open sources.
-- Entities come from the IRS Exempt Organizations Business Master File (public, per-state CSV).
-- Facts (SPOC quads) come from cited web research; every row carries its source and fetched_at.
CREATE TABLE IF NOT EXISTS community_gravity_orgs (
  ein            varchar(12) PRIMARY KEY,
  name           text NOT NULL,
  city           varchar(120) NOT NULL,
  state          varchar(2) NOT NULL,
  zip            varchar(10),
  county_fips    varchar(5),
  ntee_code      varchar(10),
  domain         varchar(40) NOT NULL,          -- derived from NTEE major group; method disclosed in API
  subsection     varchar(4),
  revenue_amt    bigint,                         -- IRS BMF REVENUE_AMT (most recent filing; may be null)
  asset_amt      bigint,
  tax_period     varchar(6),
  source         varchar(40) NOT NULL DEFAULT 'irs_eo_bmf',
  source_url     text NOT NULL,
  fetched_at     timestamptz NOT NULL DEFAULT now(),
  verified_by    varchar(100),                   -- staff user id; "AI/open data proposes, humans apply"
  verified_at    timestamptz,
  verified_note  text
);
CREATE INDEX IF NOT EXISTS cg_orgs_city_state_idx ON community_gravity_orgs (state, city);
CREATE INDEX IF NOT EXISTS cg_orgs_domain_idx ON community_gravity_orgs (state, domain);

CREATE TABLE IF NOT EXISTS community_gravity_facts (
  id          bigserial PRIMARY KEY,
  subject_ein varchar(12) NOT NULL REFERENCES community_gravity_orgs(ein) ON DELETE CASCADE,
  predicate   varchar(60) NOT NULL,              -- e.g. does, serves, website, partners_with, located_in
  object      text NOT NULL,
  context     text NOT NULL,                     -- provenance: citation URL or "irs_eo_bmf"
  method      varchar(40) NOT NULL,              -- 'web_research_llm' | 'irs_eo_bmf'
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cg_facts_subject_idx ON community_gravity_facts (subject_ein);
