import yfinance as yf
import pandas as pd
import pymongo
import json
import os
from datetime import datetime

FILE_PATH = os.path.dirname(os.path.abspath(__file__))

class YFScraper:
    def __init__(self):
        config_dir = os.path.join(FILE_PATH, '..', 'config.json')

        # get the variables from config.json
        with open(config_dir, "r") as f:
            config = json.load(f)
            self.mongo_url = config["MONGODB_URI"]
            self.db_name = config["MONGODB_DBNAME"]
            self.col_name = config["MONGODB_COLLECTION"]

        try:
            self.client = pymongo.MongoClient(self.mongo_url)
            self.db = self.client[self.db_name]
            self.collection = self.db[self.col_name]
            print("...Successfully connected to Database\n")
        except:
            print("...Failed to connect to Database\n")
            raise

    def get_historical_data(self, symbol, start_time, end_time):
        data = yf.download(symbol, start=start_time, end=end_time)
        data = data.reset_index()
        data = data.to_dict('records')
        
        # insert data into MongoDB
        # add symbol as new collection if not exist
        collection_name = f"{symbol}-prices-data"
        if collection_name not in self.db.list_collection_names():
            self.db.create_collection(collection_name)
        else:
            # update data if collection already exist
            self.db[collection_name].delete_many({})


        # insert data into collection
        self.db[collection_name].insert_many(data)

    def get_stock_index(self, symbol):
        data = yf.Ticker(symbol)
        prices = data.history(period="3y")
        prices = prices.reset_index()
        prices = prices.to_dict('records')
        
        # turn all DateTimes into strings
        for price in prices:
            price["Date"] = price["Date"].strftime("%Y-%m-%d")
        return prices


# if __name__ == "__main__":
#     today = datetime.today().strftime("%Y-%m-%d")
#     years_ago = (datetime.today() - pd.DateOffset(years=3)).strftime("%Y-%m-%d")
#     test = YFScraper()
#     # test.get_historical_data("^TWII", years_ago, today)
#     print(test.get_stock_index("^TWII"))