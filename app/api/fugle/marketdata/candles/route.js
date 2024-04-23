import { NextResponse } from 'next/server';
import { RestClient} from '@fugle/marketdata';
import "isomorphic-fetch";

export async function GET(request) {
    try {
        // Get the query parameters from the request URL
        const params = request.nextUrl.searchParams;

        const client = new RestClient({ apiKey: 'Zjc5NTk0OGMtMjI5ZC00OTRmLWE3YzItOTI3NDQwNjlhNjg1IDkxMDlmN2RjLTA1MWMtNGUzMi1hZGMxLTQyZDI3NzExOGJlOA==' });
        let newParams = {
            "symbol": params.get("symbol"),
            "timeframe": params.get("type"),
        };

        const stock = client.stock;   // Stock REST API client
        let rawData = await stock.historical.candles(newParams);

        if (["D", "W", "M"].includes(newParams.timeframe)) {
            newParams.from = params.get("from");
            newParams.to = params.get("to");
        } else {
            let nowData = await stock.intraday.candles(newParams);

            const dataA = rawData.data;
            const dataB = nowData.data;
            const notInA = dataB.filter(itemB =>
                !dataA.some(itemA => itemA.date === itemB.date)
              );
              
            rawData.data = dataA.concat(notInA);
        }
 
        const result = Array.from(rawData.data.map((nowData)=>{return (
            {symbol: newParams.symbol, ...nowData, origin: "fugle"}
        )}))
        // Return the fetched data
        return NextResponse.json( result ); 

    } catch (error) {
        // Log the error
        console.error(error);
        
        // Return an error response
        return NextResponse.error({ message: error.message });
    }
}