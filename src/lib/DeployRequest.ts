export default class DeployRequest {
    public id: string;
    public status: string;
    public date: number;

    constructor() {
      this.date = Date.now();
    }

    public toJSON() {
      return {
        id: this.id,
        status: this.status,
        date: this.date
      };
    }

    public readDeployRequest(v1: string, v2: string) {
      const r = '123';

      return r;
    }

  }
