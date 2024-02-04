from fugle_marketdata import RestClient


client = RestClient(api_key = 'ZGM0NzY5YzMtOWQ1Mi00YTZlLTllZmYtYTkzNGEwZmJhZjBkIGFhMmY2ODJiLTI2NDktNGUwZi1hYzZmLTU4ZDA4ODY5NzdjZQ==')  # 輸入您的 API key
stock = client.stock  # Stock REST API client

print(stock.historical.candles(**{"symbol": "0050", "from": "2023-02-06", "to": "2023-02-08", "fields": "open,high,low,close,volume,change"}))