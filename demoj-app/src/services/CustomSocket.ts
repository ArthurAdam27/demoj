import { DeviceTypes, IConfig } from "@/types/IConfig";
import { Socket, io } from "socket.io-client";
import { Ref, ref } from "vue";
import API from "./API";
import { SoundEnum, SoundManager } from "./SoundManager";

export class CustomSocket {
    private socket: Socket | null;
    private config: Ref<IConfig | null>;
    private soundManager: SoundManager;

    constructor() {
        this.socket = null;
        this.config = ref(null);

        this.soundManager = new SoundManager();
        this.soundManager.loadSounds([SoundEnum.NAVIGATION_FORWARD_SELECTION, SoundEnum.NAVIGATION_BACKWARD_SELECTION, SoundEnum.UI_LOADING])
    }

    public connect() {
        console.log("Connecting to socket...");
        this.socket = io(`http://${import.meta.env.VITE_IP_NETWORK}:${import.meta.env.VITE_PORT}`);

        this.socket.on("connect", () => {
            console.log("Socket connected");
            this.soundManager.playSound(SoundEnum.NAVIGATION_FORWARD_SELECTION);
            this.socket?.emit("ready", { device: "client" });

            API.getConfig().then((config) => {
                this.config.value = config;
            });
        });

        this.socket.on("disconnect", () => {
            console.log("Socket closed");
            if (this.config.value) {
                this.config.value.modules.terminal.isConnected = false;
                this.config.value.modules.server.isConnected = false;
                this.config.value.modules.network.isConnected = false;
            }
            this.reconnect();
        });

        this.socket.on("error", (error: any) => {
            console.log("Socket error");
            console.log(error);
        });

        this.socket.on("connect_error", (error: any) => {
            console.log("Socket connection error, reconnecting...");
            // console.log(error);
            this.reconnect();
        });

        this.socket.on("connect_timeout", (error: any) => {
            console.log("Socket timeout, reconnecting...");
            // console.log(error);
            this.reconnect();
        });

        this.socket.on("module_status", (data: { device: DeviceTypes; status: "on" | "off" }) => {
            console.log(`Socket ${data.device} status: ${data.status}`);

            if (this.config.value) this.config.value.modules[data.device].isConnected = data.status == "on";

            if (data.status == "on") {
                this.soundManager.playSound(SoundEnum.NAVIGATION_FORWARD_SELECTION);
            } else {
                this.soundManager.playSound(SoundEnum.NAVIGATION_BACKWARD_SELECTION);
            }
        });
    }

    private reconnect() {
        setTimeout(() => {
            this.soundManager.playSound(SoundEnum.UI_LOADING);

            if (this.socket && !this.socket.connected) this.socket.connect();
        }, 1000);
    }

    public disconnect() {
        if (this.socket && this.socket.connected) this.socket.disconnect();
    }

    public isConnected() {
        return this.socket?.connected;
    }

    public updateModuleStatus(module: DeviceTypes, action: "restart" | "stop") {
        if (this.socket) this.socket.emit("update_module_status", { device: module, action: action });
    }

    public stressModule(module: DeviceTypes, level: 1 | 2 | 3, time: number) {
        if (this.socket) this.socket.emit("stress_module", { device: module, level: level, time: time });
    }

    public getConfig() {
        return this.config;
    }
}

export default new CustomSocket();