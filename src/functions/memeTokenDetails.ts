export const memeTokenDetail = async (tokenName: string) => {
    // Fetch both BNB price and token details in parallel
    const [bnbPriceRes, tokenRes] = await Promise.all([
        fetch("https://api.binance.com/api/v3/ticker/price?symbol=BNBUSDT"),
        fetch(`https://www.four.meme/meme-api/v1/private/token/query?tokenName=${encodeURIComponent(tokenName)}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            }
        })
    ]);

    // Validate both responses
    if (!bnbPriceRes.ok) throw new Error(`Failed to fetch BNB price: ${bnbPriceRes.status}`);
    if (!tokenRes.ok) throw new Error(`Failed to fetch token details: ${tokenRes.status}`);

    const [bnbPriceJson, tokenJson] = await Promise.all([bnbPriceRes.json(), tokenRes.json()]);

    const BNB_TO_USDT = parseFloat(bnbPriceJson.price);
    const token = tokenJson.data?.[0];

    if (!token || !token.tokenPrice?.price) {
        return {
            content: [{ type: "text", text: "Token not found or price unavailable." }],
            isError: true
        };
    }

    const bnbPrice = parseFloat(token.tokenPrice.price);
    const priceInUsdt = bnbPrice * BNB_TO_USDT;

    const data = {
        ...token,
        tokenPrice: {
            ...token.tokenPrice,
            priceInUsdt: priceInUsdt.toFixed(10)
        }
    };

    return data;
};
