export type MarketHealth = {
  status: "healthy" | "warning" | "check_failed";
  pegStable?: boolean;
  volumeAdequate?: boolean;
  pegPrice?: string;
  pegDriftPercent?: string;
  volume24hUsd?: string;
  recommendation: string;
  rawData?: unknown;
};

const STABLECOIN_PROXY_SYMBOL = "USDCUSDT";

export async function checkMarketHealth(): Promise<MarketHealth> {
  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${STABLECOIN_PROXY_SYMBOL}`,
      { method: "GET", headers: { Accept: "application/json" } },
    );
    if (!response.ok) {
      return {
        status: "check_failed",
        recommendation: `Binance market endpoint returned HTTP ${response.status}. Proceed with caution.`,
      };
    }
    const data = (await response.json()) as {
      lastPrice: string;
      priceChangePercent: string;
      quoteVolume: string;
    };

    const price = parseFloat(data.lastPrice);
    const driftPct = Math.abs(parseFloat(data.priceChangePercent));
    const volumeUsd = parseFloat(data.quoteVolume);

    const pegStable = Math.abs(price - 1) < 0.02;
    const volumeAdequate = volumeUsd > 1_000_000;

    const pegPrice = price.toFixed(4);
    const pegDriftPercent = driftPct.toFixed(3);
    const volume24hUsd = `${(volumeUsd / 1_000_000).toFixed(1)}M`;

    if (pegStable && volumeAdequate) {
      return {
        status: "healthy",
        pegStable: true,
        volumeAdequate: true,
        pegPrice,
        pegDriftPercent,
        volume24hUsd,
        recommendation: `Stablecoin peg at $${pegPrice} (24h drift ${pegDriftPercent}%), volume $${volume24hUsd}. Safe to proceed with dNZD payment.`,
      };
    }

    return {
      status: "warning",
      pegStable,
      volumeAdequate,
      pegPrice,
      pegDriftPercent,
      volume24hUsd,
      recommendation: `Stablecoin peg at $${pegPrice} (drift ${pegDriftPercent}%), volume $${volume24hUsd}. ${pegStable ? "" : "Peg drift > 2%. "}${volumeAdequate ? "" : "Low liquidity. "}Review before paying.`,
    };
  } catch (err) {
    return {
      status: "check_failed",
      recommendation: `Could not verify market conditions (${(err as Error).message}). Proceed with caution.`,
    };
  }
}

export async function checkSocialSentiment() {
  try {
    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22%2C%22ETHUSDT%22%2C%22AVAXUSDT%22%5D",
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) return { status: "unavailable" };
    return await response.json();
  } catch {
    return { status: "unavailable" };
  }
}
