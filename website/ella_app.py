from flask import Flask, render_template, jsonify, json
import pandas as pd
import numpy as np

app = Flask(__name__)

# Route for serving the DataTables HTML
@app.route('/')
def index():
    return render_template('ella_index.html')

# Route for providing the data for the DataTables
@app.route('/data')
def data():
    # Read the CSV data into a pandas DataFrame
    df = pd.read_csv('ella_data.csv')
    # Convert the DataFrame to a dictionary, orient by records for DataTables
    # select only the "department" and "Email Address" columns
    df = df.fillna('')
    df = df[['use any job submission system','use any programming tools specialized for the specific hardware','project require specific hardware','machines dedicated to your projects or shared with others','what machines typically run your software on','when was the majority of this project written?','research staff dedicated to programming','how many people contribute to this project','how large is codebase of project','programs/libraries software stack uses for numerical computation','what programming languages are the softwares written in','source code of software available to the public','software stack for your current research project','aim for portability and reusability','aim for performance','how long code you write stick around','operating systems primarily used','write software to automate mundane tasks','what programming language(s) do you use','last time learned new programming language','attended special training in past year','first programming language','how long programming',
             'top cluster user','uses computation','department','Email Address']]
    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True)