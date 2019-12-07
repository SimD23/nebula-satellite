console.log("Nebula Jetpack");

import io from "socket.io-client";
import chalk from "chalk";
import _ from "lodash";
import readline from "readline-sync";
import { parseString } from "xml2js";
var fetch = require("node-fetch");

// Bleno requires these installs
// sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev

class Jetpack {
  constructor(optiosn = {}) {
    this.modules = [new XML_Loader({ function: "command" })];

    this.connection = undefined;
    // this.connection = io("http://192.168.42.107:2310");
    // this.connection.on("satellite", data => {
    //   console.log(data);
    // });
  }
  getData() {
    for (const dataGetter of this.modules) {
      dataGetter.getData();
    }
  }
}
class dataGetter {
  constructor(options = {}) {
    let self = this;

    this.options = { ...options };
    this.interval = 10000;
    this.ticker = setInterval(function() {
      self.getData();
    }, this.interval);
  }
  publish(options = {}, data) {
    satellite.connection.emit("nebula", {
      module: "ground-control",
      function: "report",
      ...options,
      value: data
    });
  }
  getData() {}
}

class XML_Loader extends dataGetter {
  constructor(options = {}) {
    super(options);
    this.src = options.src || "http://192.168.42.107:8088/api";
  }
  async getData() {
    let self = this;
    fetch(this.src)
      .then(response => response.text())
      .then(str =>
        parseString(str, function(err, result) {
          self.publish(self.options, result);
        })
      );
  }
}

const jetpack = new Jetpack();
