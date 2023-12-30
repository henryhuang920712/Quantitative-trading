import ccxt
import pandas as pd
api_key = "oSivpYjlZ2cN9q8N8oL61LyEZ1xKuMmNiHo9quCTv4QzJnxchmKA9E9J9DYqoc7P"
secret = "3KZLDBMfN0cUGzWt2C3NEZdYldCJX2m8eMEMCdLKRXGk8vKlyDhpknKeuieWjR8C"

exchange = ccxt.binance({
    'apiKey': api_key,
    'secret': secret,
    'enableRateLimit': True,
})

crypto_symbol = 'BTC'
timeframe = '1h'

# Specify the symbol, timeframe, and start date
symbol = f'{crypto_symbol}/USDT'

# Convert the start date to a timestamp
from_timestamp = exchange.parse8601("2020-01-01 00:00:00")

# Fetch the OHLCV data
ohlcv = exchange.fetch_ohlcv(symbol, timeframe, from_timestamp, limit=1000)

# Convert the data to a DataFrame
df = pd.DataFrame(
    ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])

# Format the timestamp column
df['timestamp'] = df['timestamp'].apply(exchange.iso8601)

# Set the timestamp column as the DataFrame's index
df = df.set_index('timestamp')

# Display the DataFrame's head
print(df.head())
