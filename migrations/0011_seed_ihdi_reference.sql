-- seed_ihdi_reference.sql
-- Static international/national IHDI reference rows.
--
-- These are comparison context only — "the floor that's been proven
-- achievable." They are NEVER blended into a US geography's computed score.
-- The is_reference flag makes them immutable via the trigger in 001.
--
-- Keyed on hdr_edition, NOT year alone: UNDP revises retroactively and
-- component values are restated across editions. A join on year alone will
-- silently mix editions.
--
-- Source: UNDP Human Development Report 2025, Statistical Annex Table 3
--         (2023 data, published 2025-05-06)
--         https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf

BEGIN;

INSERT INTO benchmark_metrics (
  id, domain, metric_key, geo_level, geo_value,
  value, unit, year,
  measurement_system, comparison_set, hdr_edition,
  rank, rank_conf, is_reference,
  source_publisher, source_url
) VALUES
-- Overall loss due to inequality (%) ---------------------------------------
('ihdi.overall_loss.intl.ISL.2023','economic','ihdi_overall_loss_pct','international','Iceland',
  5.0,'pct',2023,'HDR25','all ranked countries','HDR25',1,'verified',TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.intl.NOR.2023','economic','ihdi_overall_loss_pct','international','Norway',
  6.3,'pct',2023,'HDR25','all ranked countries','HDR25',2,'verified',TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.intl.DNK.2023','economic','ihdi_overall_loss_pct','international','Denmark',
  5.5,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.intl.SVN.2023','economic','ihdi_overall_loss_pct','international','Slovenia',
  4.9,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.intl.CZE.2023','economic','ihdi_overall_loss_pct','international','Czechia',
  5.2,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.intl.JPN.2023','economic','ihdi_overall_loss_pct','international','Japan',
  8.6,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.intl.CAN.2023','economic','ihdi_overall_loss_pct','international','Canada',
  7.7,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.agg.OECD.2023','economic','ihdi_overall_loss_pct','international','OECD_avg',
  11.4,'pct',2023,'HDR25','OECD member states','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.agg.VHHD.2023','economic','ihdi_overall_loss_pct','international','Very_high_HD_group',
  10.2,'pct',2023,'HDR25','very high human development group','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.overall_loss.natl.USA.2023','economic','ihdi_overall_loss_pct','national',NULL,
  11.3,'pct',2023,'HDR25','all ranked countries','HDR25',29,'verified',TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),

-- US component decomposition — the acceptance-test fixtures ----------------
('ihdi.hdi.natl.USA.2023','economic','hdi','national',NULL,
  0.938,'index',2023,'HDR25','all ranked countries','HDR25',17,'verified',TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.ihdi.natl.USA.2023','economic','ihdi','national',NULL,
  0.832,'index',2023,'HDR25','all ranked countries','HDR25',29,'verified',TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.a_health.natl.USA.2023','health','ihdi_inequality_life_expectancy_pct','national',NULL,
  5.5,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.a_education.natl.USA.2023','education','ihdi_inequality_education_pct','national',NULL,
  2.7,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('ihdi.a_income.natl.USA.2023','economic','ihdi_inequality_income_pct','national',NULL,
  23.9,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),

-- US income concentration --------------------------------------------------
('income_share.poorest40.natl.USA.2023','economic','income_share_poorest_40_pct','national',NULL,
  15.6,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('income_share.richest10.natl.USA.2023','economic','income_share_richest_10_pct','national',NULL,
  30.2,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('income_share.richest1.natl.USA.2023','economic','income_share_richest_1_pct','national',NULL,
  20.7,'pct',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf'),
('gini.natl.USA.2023','economic','gini_coefficient','national',NULL,
  41.3,'gini',2023,'HDR25','all ranked countries','HDR25',NULL,NULL,TRUE,
  'UNDP','https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_I-HDI_Table.pdf');

COMMIT;

-- ---------------------------------------------------------------------------
-- NOT SEEDED — deliberately.
--
-- State-level rankings (America's Health Rankings, Commonwealth Fund,
-- U.S. News) are verified only at the top and bottom bands. Middle ranks were
-- not verified and must NOT be inserted with invented values. When those rows
-- are added, set rank_conf = 'unverified_middle' for any rank not read
-- directly from the publisher, and let benchmark_metrics_display suppress it.
-- ---------------------------------------------------------------------------
