import { NextResponse } from 'next/server';
import { RestClient} from '@fugle/marketdata';
import "isomorphic-fetch";

export async function GET(request) {
    try {
        // Get the query parameters from the request URL
        const params = request.nextUrl.searchParams;

        const client = new RestClient({ apiKey: '0a3f59e2595c0afcf3ae' });

        const symbol = params.get("symbol");
        const stock = client.stock;   // Stock REST API client

        const result = await stock.intraday.quote({ symbol: symbol });

        // Return the fetched data
        return NextResponse.json( result ); 

    } catch (error) {
        // Log the error
        console.error(error);
        
        // Return an error response
        return NextResponse.error({ message: error.message });
    }
}