import { NextResponse } from "next/server";
import { fetchLiveUsdRates, getErApiUrl } from "@/lib/exchangeRates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rates = await fetchLiveUsdRates();
    return NextResponse.json({
      ok: true,
      provider: rates.provider,
      source: rates.source || getErApiUrl(),
      base: rates.base,
      rwfPerUsd: rates.rwfPerUsd,
      usdPerRwf: rates.usdPerRwf,
      updatedAt: rates.updatedAt,
      nextUpdateAt: rates.nextUpdateAt,
      fetchedAt: new Date(rates.fetchedAt).toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Could not load live exchange rates",
        source: getErApiUrl(),
      },
      { status: 502 }
    );
  }
}
