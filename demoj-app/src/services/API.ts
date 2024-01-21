import { DeviceTypes, IConfig, IParameter } from "@/types/IConfig";
import axios from "axios";

class API {
    private timeout = 3000;
    private terminalIP = "http://" + import.meta.env.VITE_IP_TERMINAL + ":" + import.meta.env.VITE_PORT;
    private networkIP = "http://" + import.meta.env.VITE_IP_NETWORK + ":" + import.meta.env.VITE_PORT;
    private serverIP = "http://" + import.meta.env.VITE_IP_SERVER + ":" + import.meta.env.VITE_PORT;

    private async getConfig(): Promise<IConfig | null> {
        return await axios
            .get(this.networkIP + "/config", { timeout: this.timeout })
            .then((response) => {
                return response.data as IConfig;
            })
            .catch((error) => {
                console.error(error);
                return null;
            });
    }

    async isConnected(device: DeviceTypes): Promise<boolean> {
        const config = await this.getConfig();

        if (config == null) return false;

        try {
            return config.modules[device].isConnected;
        } catch (error) {
            console.error("Unable to get connection status for device: " + device);
            console.error(error);
            return false;
        }
    }

    async getModuleParameters(device: DeviceTypes): Promise<IParameter[]> {
        const config = await this.getConfig();

        if (config == null) return [];

        try {
            const parameters = config.modules[device].parameters;
            if (parameters == null) return [];

            return parameters;
        } catch (error) {
            console.error("Unable to get parameters for device: " + device);
            console.error(error);
            return [];
        }
    }

    async setParameterState(device: DeviceTypes, id: number, isActive: boolean): Promise<boolean> {
        return await axios
            .post(this.networkIP + `/modules/${device}/params/${id}`, { isActive: isActive }, { timeout: this.timeout })
            .then(() => {
                return true;
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    }

    async setParameterValue(device: DeviceTypes, id: number, value: number): Promise<boolean> {
        return await axios
            .post(this.networkIP + `/modules/${device}/params/${id}`, { value: value }, { timeout: this.timeout })
            .then(() => {
                return true;
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    }

    async restartModule(): Promise<boolean> {
        // TODO Add restart specific module
        return await axios
            .get(this.networkIP + `/restart`, { timeout: this.timeout })
            .then(() => {
                return true;
            })
            .catch((error) => {
                console.log(error);
                return false;
            });
    }

    async stopModule(): Promise<boolean> {
        // TODO Add stop specific module
        return await axios
            .get(this.networkIP + `/stop`, { timeout: this.timeout })
            .then(() => {
                return true;
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    }

    async ping(device: DeviceTypes): Promise<boolean> {
        return await axios
            .get(this.networkIP + `/ping/${device}`, { timeout: this.timeout })
            .then(() => {
                return true;
            })
            .catch((error) => {
                console.error(error);
                return false;
            });
    }
}

export default new API();