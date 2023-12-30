from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/api/quantitative-trading", methods=["GET"])
def get_stock_data():
    return jsonify({"message": "Hello, world!"})




if __name__ == "__main__":
    app.run(debug=True, port=8080)