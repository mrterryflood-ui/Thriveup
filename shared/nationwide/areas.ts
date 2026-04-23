// RPLICE v2 — Replicable Contract
// Canonical benefit-area vocabulary. Byte-identical across peers.

export const BENEFIT_AREAS = [
  { id: "healthcare-access",         name: "Healthcare Access",           nameEs: "Acceso a Atención Médica" },
  { id: "mental-health",             name: "Mental Health",               nameEs: "Salud Mental" },
  { id: "dental-health",             name: "Dental Health",               nameEs: "Salud Dental" },
  { id: "healthy-aging",             name: "Healthy Aging",               nameEs: "Envejecimiento Saludable" },
  { id: "healthy-children-families", name: "Healthy Children & Families", nameEs: "Niños y Familias Saludables" },
  { id: "food-nutrition",            name: "Food & Nutrition",            nameEs: "Alimentos y Nutrición" },
  { id: "housing",                   name: "Housing",                     nameEs: "Vivienda" },
  { id: "income-employment",         name: "Income & Employment",         nameEs: "Ingresos y Empleo" },
  { id: "legal-rights",              name: "Legal & Rights",              nameEs: "Legal y Derechos" },
  { id: "veterans",                  name: "Veterans",                    nameEs: "Veteranos" },
] as const;
