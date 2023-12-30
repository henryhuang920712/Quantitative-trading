# connect to mongodb

import pymongo

client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["trading-project"]

# connect to collection "no-data"
# add a document {_id: "market_maker", "data": []}
def add_no_data(name):

    collection = db["no-data"]

    collection.insert_one({"_id": name, "data": []})

    # close
    client.close()

# connect to collection "stock-num"
# add a pair of keys and values, "market_maker": {} into each document
def add_stock_num(name):

    collection = db["stock-num"]

    for doc in collection.find():
        collection.update_one({"_id": doc["_id"]}, {"$set": {name: {}}})

    # close
    client.close()

add_stock_num("market_maker")