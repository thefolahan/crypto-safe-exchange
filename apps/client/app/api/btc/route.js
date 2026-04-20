let cachedPrice = null;
let lastFetched = 0;

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

async function tryCoinGecko() {
    const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
        { cache: "no-store", headers: { accept: "application/json" } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const price = Number(json?.bitcoin?.usd);

    return Number.isFinite(price) ? price : null;
}

async function tryBinance() {
    const res = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
        { cache: "no-store", headers: { accept: "application/json" } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const price = Number(json?.price);

    return Number.isFinite(price) ? price : null;
}

export async function GET() {
    try {
        const now = Date.now();

        if (cachedPrice && now - lastFetched < TWELVE_HOURS) {
            return Response.json({ price: cachedPrice, ts: lastFetched });
        }

        let price = await tryCoinGecko();

        if (!price) {
            price = await tryBinance();
        }

        if (price) {
            cachedPrice = price;
            lastFetched = now;
        }

        return Response.json({
            price: cachedPrice || null,
            ts: lastFetched || now,
        });
    } catch {
        return Response.json({
            price: cachedPrice || null,
            ts: lastFetched || Date.now(),
        });
    }
}
