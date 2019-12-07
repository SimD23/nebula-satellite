console.log("Nebula Satellite");
const dotenv = require("dotenv");
import io from "socket.io-client";
import chalk from "chalk";
import _ from "lodash";
import readline from "readline-sync";
import uuid4 from "uuid4";
import { XML_Loader } from "./modules/loaders/XML_Loader";
import { GoToUrl } from "./modules/GoToUrl";
import fs from "fs";
import path from "path";

var fetch = require("node-fetch");

var os = require("os");
var ifaces = os.networkInterfaces();
dotenv.config();
let self;

const GOOGLE_API = process.env.GOOGLE_API;
const GIT_REPO = process.env.GIT_REPO;
const GIT_USER = process.env.GIT_USER;
const GIT_PASSWORD = process.env.GIT_PASSWORD;

const git = require("simple-git/promise");
const remote = `https://${GIT_USER}:${GIT_PASSWORD}@${GIT_REPO}`;

git()
  .silent(true)
  .clone(remote)
  .then(() => console.log("finished"))
  .catch(err => console.error("failed: ", err));
class Satellite {
  constructor(options = {}) {
    self = this;
    this.poweredOn = new Date();
    this.infoPath = path.join(__dirname, "info.json");
    this.info = JSON.parse(this.getFile(this.infoPath)) || {};
    this.id = this.info.name === "DEV" ? uuid4() : this.info.id || uuid4();
    this.info.id = this.id;
    this.getNebulaIP();
    this.loadedModules = [];
    this.saveFile(this.infoPath, this.info);
  }
  setName(payload) {
    if (!this.info) {
      this.info = {};
    }
    this.info.name = payload.value;
    this.saveFile(this.infoPath, this.info);
  }
  setInfoProp(payload) {
    if (!this.info) {
      this.info = {};
    }
    this.info[payload.prop] = payload.value;
    this.saveFile(this.infoPath, this.info);
  }
  getFile(path) {
    return fs.readFileSync(path, "utf8");
  }
  saveFile(path, file) {
    if (typeof file !== "string") {
      file = JSON.stringify(file);
    }
    fs.writeFileSync(path, file);
  }
  upTime() {
    let now = new Date();
    let upTime = now - this.poweredOn;
    let time = new Date(upTime);
    return `${Pad(time.getHours())}:${time.getMinutes()}:${time.getSeconds()}`;

    function Pad(time) {
      return time < 10 ? `0${time}` : time;
    }
  }
  getNebulaIP() {
    var url = `https://sheets.googleapis.com/v4/spreadsheets/1wZff1kP9_QsXsI3910g-c2E2Hp-LkvG8ThhM5tPUsjI/values/Info?key=${GOOGLE_API}`;

    fetch(url)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Could not reach server, trying again in 5 secs");
        }
      })
      .then(json => {
        const ip = json.values[0][1];
        const status = json.values[1][1];
        console.log(ip, status);
        if (status === "Online") {
          self.initConnection({ ip });
        } else {
          throw new Error("Nebula Offline");
        }
      })
      .catch(error => {
        console.log(chalk.red("XX"), error);

        setTimeout(() => {
          if (!self.connection) {
            self.getNebulaIP();
          }
        }, 5000);
      });
  }
  getModuleByName(name) {
    return this.loadedModules.find(module => module.name === name);
  }
  initConnection({ ip, port = "2310" }) {
    self.connection = io(`http://${ip}:${port}`);
    // this.loadedModules.push(new GoToUrl({ nebulaIP: ip }));

    this.connection.on("satellite", data => {
      console.log(chalk.green(">>"), data);
      if (data.module) {
        let module = this.getModuleByName(data.module);
        if (module) {
          if (_.isFunction(module[data.function])) {
            console.log(`Executing ${chalk.green(data.function)}`);
            module[data.function](data);
          } else {
            console.log(
              `${chalk.red(data.module, data.function)} is not a function`
            );
          }
        }
      } else if (data.function) {
        if (_.isFunction(this[data.function])) {
          console.log(`Executing ${chalk.green(data.function)}`);
          this[data.function](data);
        } else {
          console.log(`${chalk.red(data.function)} is not a function`);
        }
      }
    });
  }
  getIpAddress() {
    let ipAddress = [];
    Object.keys(ifaces).forEach(function(ifname) {
      var alias = 0;

      ifaces[ifname].forEach(function(iface) {
        if ("IPv4" !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (alias >= 1) {
          // this single interface has multiple ipv4 addresses
          console.log(ifname + ":" + alias, iface.address);
          ipAddress.push({
            name: ifname + ":" + alias,
            address: iface.address
          });
        } else {
          // this interface has only one ipv4 adress
          console.log(ifname, iface.address);
          ipAddress.push({ name: ifname, address: iface.address });
        }
        ++alias;
      });
    });
    return ipAddress;
  }
  heartbeat() {
    const self = this;
    const modules = [];
    const ip = this.getIpAddress();
    const socket = this.connection.id;
    const upTime = this.upTime();
    const info = this.info;

    for (const module of self.loadedModules) {
      modules.push({
        name: module.name,
        functions: module.functions || [],
        src: module.src,
        data: JSON.stringify(module.data)
      });
    }

    satellite.connection.emit("nebula", {
      module: "constellation-manager",
      function: "heartBeatResponse",
      value: {
        socketId: socket,
        info: info,
        id: this.id,
        ip: ip,
        poweredOn: this.poweredOn,
        upTime: upTime,
        modules: modules
      }
    });
  }

  getData() {
    for (const Loader of this.loadedModules) {
      Loader.getData();
    }
  }
}

export const satellite = new Satellite();
