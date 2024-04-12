import { NextResponse } from 'next/server';
import { RestClient} from '@fugle/marketdata';
import "isomorphic-fetch";

export const revalidate = 120;
export const fetchCache = 'force-cache';

export async function GET(request) {
    try {
        // Get the query parameters from the request URL
        const params = request.nextUrl.searchParams;

        const client = new RestClient({ apiKey: 'Zjc5NTk0OGMtMjI5ZC00OTRmLWE3YzItOTI3NDQwNjlhNjg1IDkxMDlmN2RjLTA1MWMtNGUzMi1hZGMxLTQyZDI3NzExOGJlOA==' });
        let newParams = {
            "symbol": params.get("symbol"),
            "timeframe": params.get("type"),
        };


        if (["D", "W", "M"].includes(newParams.timeframe)) {
            newParams.from = params.get("from");
            newParams.to = params.get("to");
        }   
        const stock = client.stock;   // Stock REST API client

        const rawData = await stock.historical.candles(newParams);
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