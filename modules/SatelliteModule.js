import uuid4 from "uuid4";
export class SatelliteModule {
  constructor(options = {}) {
    this.id = uuid4();
    this.props = [];
    this.options = { ...options };
  }
}
