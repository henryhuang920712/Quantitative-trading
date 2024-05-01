import { NextResponse } from 'next/server';
import Pool from '@/lib/mssql_db';

export const fetchCache = 'force-cache';

export async function GET(request) {
    try {
        // Get the query parameters from the request URL
        const params = request.nextUrl.searchParams;
        const table_name = params.get("table_name");

        // Validate if table_name is provided
        if (!table_name) {
            throw new Error("table_name is missing");
        }

        // Construct the WHERE clause based on the query parameters
        const paramStr = [];
        for (const [key, value] of params.entries()) {
            if (key !== "table_name") {
                paramStr.push(`${key} = '${value}'`);
            }
        }
        const whereClause = paramStr.length > 0 ? `WHERE ${paramStr.join(" AND ")}` : "";
        const pool = await Pool();
        const result = await pool.request()
            .query(`SELECT * FROM ${table_name} ${whereClause}`);

        // Return the fetched data
        return NextResponse.json(result.recordset);

    } catch (error) {
        // Log the error
        console.error(error);
        
        // Return an error response
        return NextResponse.error({ message: error.message });
    }
}

// // insert new price data into the database
// export async function POST(request) {
//     try {
//         // Get the query parameters from the request URL
//         const params = request.nextUrl.searchParams;
//         const table_name = params.get("table_name");

//         // Validate if table_name is provided
//         if (!table_name) {
//             throw new Error("table_name is missing");
//         }

//         // Get the request body
//         const body = await request.json();
//         const pool = await Pool();
//         const result = await pool.request()
//             .input("symbol", body.symbol)
//             .input("date", body.date)
//             .input("open", body.open)
//             .input("high", body.high)
//             .input("low", body.low)
//             .input("close", body.close)
//             .input("volume", body.volume)
//             .query(`INSERT INTO ${table_name} (symbol, date, open, high, low, close, volume) VALUES (@symbol, @date, @open, @high, @low, @close, @volume)`);

//         // Return the fetched data
//         return NextResponse.json(result);

//     } catch (error) {
//         // Log the error
//         console.error(error);
        
//         // Return an error response
//         return NextResponse.error({ message: error.message });
//     }
// }