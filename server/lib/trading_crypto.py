# import the ccxt library
import ccxt

api_key = "oSivpYjlZ2cN9q8N8oL61LyEZ1xKuMmNiHo9quCTv4QzJnxchmKA9E9J9DYqoc7P"
secret = "3KZLDBMfN0cUGzWt2C3NEZdYldCJX2m8eMEMCdLKRXGk8vKlyDhpknKeuieWjR8C"

# create the exchange object
exchange = ccxt.binance({
    'apiKey': api_key,
    'secret': secret,
})

# specify the market and the amount
symbol = 'BNB/USDT'
amount = 0.1

# fetch the current price
price = exchange.fetch_ticker(symbol)['last']

# place a market buy order
order = exchange.create_market_buy_order(symbol, amount)

# print the order details
print(order)
