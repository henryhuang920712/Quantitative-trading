import { NextResponse } from 'next/server';
import { RestClient} from '@fugle/marketdata';
import "isomorphic-fetch";

export async function GET(request) {
    try {
        // Get the query parameters from the request URL
        const params = request.nextUrl.searchParams;

        const client = new RestClient({ apiKey: 'Zjc5NTk0OGMtMjI5ZC00OTRmLWE3YzItOTI3NDQwNjlhNjg1IDkxMDlmN2RjLTA1MWMtNGUzMi1hZGMxLTQyZDI3NzExOGJlOA==' });

        const symbol = params.get("symbol");
        const stock = client.stock;   // Stock REST API client

        const result = await stock.intraday.volumes({ symbol: symbol });

        // Return the fetched data
        return NextResponse.json( result ); 

    } catch (error) {
        // Log the error
        console.error(error);
        
        // Return an error response
        return NextResponse.error({ message: error.message });
    }
}