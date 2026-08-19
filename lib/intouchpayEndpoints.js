import { buildIntouchApiUrl } from "@/lib/intouchpayUrls";

function getEnvConfig() {
  return {
    baseUrl: process.env.INTOUCHPAY_BASE_URL,
    environment: process.env.INTOUCHPAY_ENV,
  };
}

function buildApiUrl(endpoint) {
  return buildIntouchApiUrl(endpoint, getEnvConfig());
}

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
