import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { fnGetDeployRequest } from '../../core/DeployRequest_List';
import { DeployRequestRes } from '../../lib/DeployRequest_Def';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('plugin2', 'org');

export default class List extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx hello:org --targetusername myOrg@example.com --targetdevhubusername devhub@org.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  My hub org id is: 00Dxx000000001234
  `,
  `$ sfdx hello:org --name myname --targetusername myOrg@example.com
  Hello myname! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    name: flags.string({char: 'n', description: messages.getMessage('nameFlagDescription')}),
    force: flags.boolean({char: 'f', description: messages.getMessage('forceFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    const conn = this.org.getConnection();

    const res: DeployRequestRes = await fnGetDeployRequest(conn);

    if (!res.error) {
      this.ux.log('----------------- PENDING ------------------------');
      for (const f of res.pending) {
        this.ux.log(f.id);
      }

      this.ux.log('----------------- FAILED ------------------------');
      for (const f of res.failed) {
        this.ux.log(f.id);
      }

      this.ux.log('----------------- SUCCESS ------------------------');
      for (const f of res.success) {
        this.ux.log(f.id);
      }
    } else {
        throw new SfdxError(res.errormessage);
    }
    return res.toJSON();
  }
}
