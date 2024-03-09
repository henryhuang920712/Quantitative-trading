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

# add_stock_num("market_maker")
    
# get all the _id from "stock-num" and store them in csv
def get_stock_num():

    collection = db["stock-num"]

    stock_num = []

    for doc in collection.find():
        stock_num.append(doc["_id"])

    # close
    client.close()

    # store in csv
    with open("stock_num.csv", "w") as f:
        for item in stock_num:
            f.write(f"{item}\n")

    return stock_num

collection = db["stock-num"]
mongo_data = collection.find()

def get_columns(key_name):
    all_data = set()
    for data in mongo_data:
        for now_key in data[key_name]:
            for each_key in data[key_name][now_key].keys():
                revised_key = each_key.replace(" ", "").replace("─", "-").replace("（", "(")\
                .replace("）", ")").replace(" ", "").replace("、", ",").replace("：", ":")\
                .replace("。", ".").replace("，", ",").replace("　", "").replace("－", "-")
                all_data.add(revised_key)

    all_data = list(all_data)
    for data in all_data:
        data = data.replace(" ", "").replace("─", "-").replace("（", "(")\
                .replace("）", ")").replace(" ", "").replace("、", ",").replace("：", ":")\
                .replace("。", ".").replace("，", ",").replace("　", "").replace("－", "-").replace(" ", "")

    all_data = set(all_data)
    return list(all_data)


result = get_columns("income_statement")
print(result)
print(len(result))

# print(list(mongo_data[0]["income_statement"].values())[0], len(list(mongo_data[0]["income_statement"].values())[0]))

