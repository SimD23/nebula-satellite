import { parseString } from "xml2js";
var fetch = require("node-fetch");
import { Loader } from "./Loader";
export class XML_Loader extends Loader {
  constructor(options = {}) {
    super(options);
    this.name = "XML_Loader";
    this.src = options.src || "http://192.168.42.107:8088/api";
    this.functions = ["getData"];
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
