import open from "open";
import { SatelliteModule } from "./SatelliteModule";

export class GoToUrl extends SatelliteModule {
  constructor(options = {}) {
    super(options);
    this.name = "url";
    this.src = `http://${options.nebulaIP}:3000/satellite`;
    this.open();
    this.functions = [{ type: "input", name: "open" }];
  }
  open(payload = {}) {
    if (!payload.value) {
      payload.value = this.src;
    }
    this.src = payload.value;

    (async () => {
      // Opens the value in the default browser.
      // const browser = await puppeteer.launch({
      //   executablePath: "/usr/bin/chromium-browser"
      // });
      console.log(">> OPENING", payload.value);
      await open(payload.value, {
        app: [
          "chrome",
          "--window-position=0,0 --kiosk  --noerrdialogs --disable-infobars"
        ]
      });
    })();
  }
}
