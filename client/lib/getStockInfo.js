

// fetch data from /api/stock-num with stock_number as a parameter
export default async function GetStockInfo(stock_number) {
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
      console.error("Error fetching data:", error.message);
    }
  }
