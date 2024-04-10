

export default async function getStockIndex(symbol) {
    try {
        // Validate if stock_number is provided
        if (!symbol) {
          throw new Error("symbol is missing");
        }
        // Fetch data from the API endpoint
        const response = await fetch(`/api/stock-index?symbol=${symbol}`);
    
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