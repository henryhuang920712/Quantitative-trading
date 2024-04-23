
// fetch data from /api/stock-num with stock_number as a parameter
export async function GetStockInfo(stock_number, type) {
	try {

		const response = await fetch(`/api/info?symbol=${stock_number}&table_name=${type}`);
		
		// Check if the request was successful (status code 200)
		if (!response.ok) {
			throw new Error(`Failed to fetch data. Status: ${response.status}`);
		}

		// Parse the JSON response
		const data = await response.json();

		// Return the fetched data
		return data;
	} catch (error) {
		// pass the error
		console.log(error);
	}
}

export async function GetStockInfoFugle(stock_number, type, from=null, to=null) {
	try {
		let response;
		if (from === null || to === null) {
			response = await fetch(`/api/fugle/marketdata/candles?symbol=${stock_number}&type=${type}`, { next: { revalidate: 120 } });
		} else {
			response = await fetch(`/api/fugle/marketdata/candles?symbol=${stock_number}&type=${type}&from=${from}&to=${to}`, { next: { revalidate: 120 } });
		}
		
		// Check if the request was successful (status code 200)
		if (!response.ok) {
			throw new Error(`Failed to fetch data. Status: ${response.status}`);
		}

		// Parse the JSON response
		const data = await response.json();

		// Return the fetched data
		return data;

	} catch (error) {
		// pass the error
		console.log(error);
	}
}

export async function GetQuotesFugle(stock_number) {
	try {
		const response = await fetch(`/api/fugle/marketdata/quotes?symbol=${stock_number}`, { next: { revalidate: 120 } });
		// Check if the request was successful (status code 200)
		if (!response.ok) {
			throw new Error(`Failed to fetch data. Status: ${response.status}`);
		}

		// Parse the JSON response
		const data = await response.json();

		// Return the fetched data
		return data;

	} catch (error) {
		// pass the error
		console.log(error);
	}
}

export async function GetTradesFugle(stock_number) {
	try {
		const response = await fetch(`/api/fugle/marketdata/trades?symbol=${stock_number}`, { next: { revalidate: 120 } });
		// Check if the request was successful (status code 200)
		if (!response.ok) {
			throw new Error(`Failed to fetch data. Status: ${response.status}`);
		}

		// Parse the JSON response
		const data = await response.json();

		// Return the fetched data
		return data;

	} catch (error) {
		// pass the error
		console.log(error);
	}
}