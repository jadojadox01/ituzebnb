const DEFAULT_BASE_URL = "https://developer.intouchpay.co.rw";

function getEnvConfig() {
  const baseUrl = (process.env.INTOUCHPAY_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const environment = process.env.INTOUCHPAY_ENV || "sandbox";
  return { baseUrl, environment };
}

function buildApiUrl(endpoint) {
  const { baseUrl, environment } = getEnvConfig();
  return `${baseUrl}/api/v1/${environment}/${endpoint}/`;
}

/** Client-safe endpoint preview (no secrets) */
export function getRequestPaymentUrl() {
  return buildApiUrl("requestpayment");
}

export function getTransactionStatusUrl() {
  return buildApiUrl("gettransactionstatus");
}

export function getBalanceUrl() {
  return buildApiUrl("getbalance");
}

export function getRequestDepositUrl() {
  return buildApiUrl("requestdeposit");
}
