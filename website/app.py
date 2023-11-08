from flask import Flask, render_template, jsonify, json
import pandas as pd
import numpy as np

app = Flask(__name__)

# Route for serving the DataTables HTML
@app.route('/')
def index():
    return render_template('index.html')

# Route for providing the data for the DataTables
@app.route('/data')
def data():
    # Read the CSV data into a pandas DataFrame
    df = pd.read_csv('data.csv')
    # Convert the DataFrame to a dictionary, orient by records for DataTables
    # select only the "department" and "Email Address" columns
    df = df.fillna('')
    df = df[['department', 'Email Address']]
    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)
