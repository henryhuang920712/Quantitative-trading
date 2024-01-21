
class StockBasicInfoData {
  constructor(stockData) {

      this.short_name = stockData["名稱"];
      this.list_date = stockData["上市日"];
      this.stock_number = stockData["basic_info"]["股票代號"];
      this.industry = stockData["產業別"];
      this.fullName = stockData["basic_info"]["公司名稱"];
      this.chairman = stockData["basic_info"]["董事長"];
      this.spokesman = stockData["basic_info"]["發言人"];
      this.foundation_date = stockData["basic_info"]["公司成立日期"];
      this.phone_num = stockData["basic_info"]["發言人電話"];
  }
}

class StockPriceData {
	constructor(priceData) {
		// check if all the required fields are provided
		if (!priceData["日期"] || !priceData["開盤價"] || !priceData["最高價"] || !priceData["最低價"] || !priceData["收盤價"] || !priceData["成交股數"] || !priceData["成交金額"] || !priceData["漲跌價差"]) {
			throw new Error("Not enough data provided");
		}
		let originalDate = new Date(priceData["日期"]);
		let year = originalDate.getFullYear() + 1911;
		this.date = new Date(year, originalDate.getMonth(), originalDate.getDate());
		this.dateString = this.formatDate(this.date);
		this.open = parseFloat(priceData["開盤價"]);
		this.high = parseFloat(priceData["最高價"]);
		this.low = parseFloat(priceData["最低價"]);
		this.close = parseFloat(priceData["收盤價"]);
		this.volume = parseFloat(priceData["成交股數"]);
		this.vob = parseFloat(priceData["成交金額"]);
		this.diff = parseFloat(priceData["漲跌價差"]);
	}
	// function formatdate
	formatDate(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
		const day = String(date.getDate()).padStart(2, '0');
	
		return `${year}-${month}-${day}`;
	}
}

// fetch data from /api/stock-num with stock_number as a parameter
export async function GetStockInfo(stock_number) {
    try {
      // Validate if stock_number is provided
      if (!stock_number) {
        throw new Error("Stock number is missing");
      }
      // Fetch data from the API endpoint
      const response = await fetch(`/api/stock-num?stock_number=${stock_number}`);
  
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

export async function getStockBasicInfo(stock_number) {
    const stockData = await GetStockInfo(stock_number);

    return new StockBasicInfoData(stockData);
}

export async function getStockPrices(stock_number) {
	const stockData = await GetStockInfo(stock_number);

	let pricesData = [];
	if (stockData && Array.isArray(stockData.prices)) {
		for (let priceData of stockData["prices"]) {
			pricesData.push(new StockPriceData(priceData));
		}


		// sort the pricesData by date
		pricesData.sort((a, b) => {
			return a.date - b.date;
		});

		return pricesData;
	}
}

export async function getStockBalSheet(stock_number) {
	const stockData = await GetStockInfo(stock_number);

	let balSheetData = [];
	if (stockData && Array.isArray(stockData["balance_sheet"])) {
		for (let balSheet of stockData["balance_sheet"]) {
			balSheetData.push(balSheet);
		} 
		balSheetData.reverse();

		return balSheetData;
	}
	return stockData["balance_sheet"];
}