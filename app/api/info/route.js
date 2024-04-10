import { NextResponse } from 'next/server';
import Pool from '@/lib/mssql_db';

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

        const pool = await Pool();
        const result = await pool.request()
            .query(`SELECT * FROM ${table_name} WHERE ${paramStr.join(" AND ")}`);

        // Return the fetched data
        return NextResponse.json(result.recordset);

    } catch (error) {
        // Log the error
        console.error(error);
        
        // Return an error response
        return NextResponse.error({ message: error.message });
    }
}
