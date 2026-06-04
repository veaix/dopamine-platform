export function isProductionSetupBlocked() {
  return process.env.NODE_ENV === "production" && process.env.ALLOW_SETUP_ROUTES !== "1";
}
