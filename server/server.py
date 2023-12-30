from flask import Flask, request, jsonify
from flask_cors import CORS
from tools.back_tester import TWSEBacktester

back_tester = TWSEBacktester("2020-01-01", "2022-12-31")

app = Flask(__name__)

CORS(app)


# log = logging.getLogger('flask')
# log.setLevel(logging.CRITICAL)


@app.route("/api/stock-num", methods=["GET"])
def get_stock_info():
    stock_number = request.args.get("stock_number")

    if stock_number is None:
        return jsonify({"error": "Stock number is missing"}), 400
    
    stock_data = back_tester.get_stock_info(stock_number)

    return jsonify(stock_data)



if __name__ == "__main__":
    app.config['JSON_AS_ASCII'] = False
    app.config['JSONIFY_MIMETYPE'] = "application/json;charset=utf-8"
    app.run(debug=True, port=8080)