from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

config = "network/config.json"

# ! Route to receive data
@app.route('/receive_data', methods=['POST'])
def receive_data():
    data = request.get_json()
    print("Received data:", data)

    return jsonify({"message": "Data received successfully"})

# ! Route to get config data
@app.route('/config', methods=['GET'])
def get_config():
    try:
        with open(config, 'r') as config_file:
            config_data = json.load(config_file)
            return jsonify(config_data)
    except FileNotFoundError:
        return jsonify({"error": "Config file not found"}), 404
    except Exception as e:
        print(f"Error reading config file: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ! Route to update parameter status and value
@app.route('/modules/<module>/params/<id_param>', methods=['POST'])
def update_parameter(module, id_param):
    try:
        data = request.get_json()
        is_active = data.get('isActive')
        value = data.get('value')

        with open(config, 'r+') as config_file:
            config_data = json.load(config_file)

        if 'modules' in config_data and module in config_data['modules']:
            device = config_data['modules'][module]
            if 'parameters' in device:
                for param in device['parameters']:
                    if int(param['id']) == int(id_param):
                        if is_active is not None:
                            param['isActive'] = is_active
                        if value is not None:
                            param['value'] = value
                        # TODO : toggle parameter on module

        with open(config, 'w') as config_file:
            json.dump(config_data, config_file, indent=2)

        return jsonify({"message": "Parameter toggled successfully"})
    except Exception as e:
        print(f"Error toggling parameter: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
