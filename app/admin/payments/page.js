"use client";

import { useState } from "react";
import {
  getRequestPaymentUrl,
  getRequestDepositUrl,
  getTransactionStatusUrl,
  getBalanceUrl,
} from "@/lib/intouchpayEndpoints";

const callbackPreview =
  typeof window !== "undefined"
    ? `${window.location.origin}/api/payment/intouchpay/callback`
    : "/api/payment/intouchpay/callback";

export default function AdminPayments() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [hashCheck, setHashCheck] = useState({
    timestamp: "20260727081934",
    expectedHash: "ec91238220f0171aca0b22bf84f69a7b555e27b5671c34805909fcf2985b6634",
  });
  const [hashResult, setHashResult] = useState(null);
  const [depositForm, setDepositForm] = useState({
    amount: "500",
    mobilephone: "0786328597",
    requesttransactionid: "PAY0052026",
    reason: "",
    withdrawcharge: 0,
    sid: 1,
  });
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositResult, setDepositResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/payments/intouchpay/test", { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, message: "Could not reach the test endpoint." });
    } finally {
      setTesting(false);
    }
  };

  const handleVerifyHash = async () => {
    setHashResult(null);
    try {
      const res = await fetch("/api/payments/intouchpay/verify-hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hashCheck),
      });
      const data = await res.json();
      setHashResult(data);
    } catch {
      setHashResult({ message: "Could not verify hash." });
    }
  };

  const handleTestDeposit = async () => {
    setDepositLoading(true);
    setDepositResult(null);
    try {
      const res = await fetch("/api/payments/intouchpay/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(depositForm),
      });
      const data = await res.json();
      setDepositResult(data);
    } catch {
      setDepositResult({ ok: false, message: "Could not reach deposit test endpoint." });
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Payment settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Credentials load from <span className="font-mono">.env</span> on the server only.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold">IntouchPay sandbox</h2>

        <div className="mt-4 rounded-md border border-border bg-muted/20 p-4 text-sm">
          <p className="font-bold">Endpoints</p>
          <ul className="mt-2 space-y-1 break-all font-mono text-xs text-muted-foreground">
            <li>Request: {getRequestPaymentUrl()}</li>
            <li>Deposit: {getRequestDepositUrl()}</li>
            <li>Status: {getTransactionStatusUrl()}</li>
            <li>Balance: {getBalanceUrl()}</li>
            <li>Callback: {callbackPreview}</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Production: set <span className="font-mono">NEXT_PUBLIC_APP_URL=https://yourdomain.com</span> — callback is built automatically.
          </p>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <p className="font-bold">IntouchPay dashboard notes</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>0 RWF + gettransactionstatus</strong> is normal — that API only checks status; it does not move money. Real amounts appear on <strong>requestpayment</strong> rows.
              </li>
              <li>
                Callback URL must be public HTTPS (ngrok in dev). IntouchPay requires HTTP 200 with{" "}
                <span className="font-mono">{`{ "message": "success", "success": true, "request_id": "..." }`}</span>
              </li>
              <li>
                Set <span className="font-mono">INTOUCHPAY_CALLBACK_URL</span> to your ngrok URL +{" "}
                <span className="font-mono">/api/payment/intouchpay/callback</span> and restart the server.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="rounded-md border border-primary px-4 py-2 text-sm font-bold text-primary disabled:opacity-60"
          >
            {testing ? "Testing..." : "Test connection"}
          </button>
        </div>

        {testResult && (
          <div
            className={`mt-3 rounded-md p-3 text-sm ${testResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
          >
            <p className="font-bold">{testResult.message}</p>
            {testResult.apiUrl && <p className="mt-1 break-all text-xs">URL: {testResult.apiUrl}</p>}
          </div>
        )}

        <div className="mt-6 rounded-md border border-border bg-muted/20 p-4">
          <p className="text-sm font-bold">Verify Swagger password hash</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste timestamp + hash from Swagger. If mismatch, fix <span className="font-mono">INTOUCHPAY_PARTNER_PASSWORD</span> in .env and restart.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="Timestamp"
              value={hashCheck.timestamp}
              onChange={(e) => setHashCheck({ ...hashCheck, timestamp: e.target.value })}
            />
            <input
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              placeholder="Expected hash from Swagger"
              value={hashCheck.expectedHash}
              onChange={(e) => setHashCheck({ ...hashCheck, expectedHash: e.target.value })}
            />
          </div>
          <button
            type="button"
            onClick={handleVerifyHash}
            className="mt-3 rounded-md border border-border bg-white px-4 py-2 text-sm font-bold"
          >
            Verify hash
          </button>
          {hashResult && (
            <div className="mt-3 space-y-1 text-sm">
              <p className={`font-semibold ${hashResult.matches ? "text-green-700" : "text-red-700"}`}>
                {hashResult.message ||
                  (hashResult.matches
                    ? `Match (${hashResult.matchMode})`
                    : "Hash does not match — password in .env is wrong or has hidden characters.")}
              </p>
              {hashResult.passwordLength != null && (
                <p className="text-xs text-muted-foreground">Password length loaded: {hashResult.passwordLength} chars</p>
              )}
              {!hashResult.matches && (
                <p className="break-all font-mono text-xs text-muted-foreground">
                  Computed (with account): {hashResult.computed}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-md border border-border bg-muted/20 p-4">
          <p className="text-sm font-bold">Test sandbox deposit (requestdeposit)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Sends MoMo to the phone below from your IntouchPay sandbox balance. Use a unique request ID each test.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold">
              Amount (RWF)
              <input
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold">
              Mobile phone
              <input
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={depositForm.mobilephone}
                onChange={(e) => setDepositForm({ ...depositForm, mobilephone: e.target.value })}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
              Request transaction ID
              <input
                className="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                value={depositForm.requesttransactionid}
                onChange={(e) => setDepositForm({ ...depositForm, requesttransactionid: e.target.value })}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleTestDeposit}
            disabled={depositLoading}
            className="mt-3 rounded-md border border-secondary bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground disabled:opacity-60"
          >
            {depositLoading ? "Sending deposit..." : "Test deposit"}
          </button>
          {depositResult && (
            <div
              className={`mt-3 rounded-md p-3 text-sm ${depositResult.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
            >
              <p className="font-bold">{depositResult.ok ? "Deposit request sent" : depositResult.message}</p>
              {depositResult.apiUrl && <p className="mt-1 break-all text-xs">URL: {depositResult.apiUrl}</p>}
              {depositResult.intouch && (
                <pre className="mt-2 overflow-x-auto rounded bg-white/70 p-2 text-xs">
                  {JSON.stringify(depositResult.intouch, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
