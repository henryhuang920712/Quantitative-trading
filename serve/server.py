from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/trading-project", methods=["GET"])
def get_stock_data():
    return jsonify({"message": "Hello, world!"})




if __name__ == "__main__":
    app.run(debug=True)