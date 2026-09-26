export type ChildCOREIngressPartner = {
  partnerName: string;
  keyHash: string;
  scopes: readonly string[];
};

export type ChildCOREIngressAuthorizationFailure =
  | "wrong_partner_identity"
  | "missing_scope";

export function checkChildCOREIngressAuthorization(
  partner: ChildCOREIngressPartner,
  configuredKeyHash: string,
): ChildCOREIngressAuthorizationFailure | null {
  if (
    partner.partnerName.trim().toLowerCase() !== "childcore" ||
    !configuredKeyHash ||
    partner.keyHash !== configuredKeyHash
  ) {
    return "wrong_partner_identity";
  }

  if (!partner.scopes.includes("inbound:write")) {
    return "missing_scope";
  }

  return null;
}