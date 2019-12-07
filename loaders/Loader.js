import chalk from "chalk";
import { SatelliteModule, satellite } from "../../satellite";
export class Loader extends SatelliteModule {
  constructor(options = {}) {
    super(options);
    let self = this;
    this.interval = 10000;
    this.ticker = setInterval(function() {
      self.getData();
    }, this.interval);
  }
  publish(options = {}, data) {
    let packet = {
      module: "constellation-manager",
      function: "report",
      ...options,
      value: data
    };
    this.data = data;
    satellite.connection.emit("nebula", packet);
    console.log(chalk.red("<<"), packet);
  }
  getData() {}
}
