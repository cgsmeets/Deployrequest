import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, Org } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { IFListRes, IFQuery, IFsobject, Organization, ENV, RELEASE_ENV } from '../../lib/DeployRequest_Def';
import { fnBuildSoql, fnGetOrganization, fnResultError, fnResultErrorMsg } from '../../lib/DeployRequest_Util';
import List from './List';


// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('plugin2', 'org');

export default class Status extends SfdxCommand {

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
    force: flags.boolean({char: 'f', description: messages.getMessage('forceFlagDescription')}),
    appcentral: flags.string({char: 'x', description: 'App central Org username or alias' }),
    managedorg: flags.string({char: 'o', description: 'Managed Org username or alias' })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    //const orgdr: IFListRes = {orgId: '00D24000000jjx3EAA', orgName: 'Salesforce', deployRequests: [{ status: 'pending', id: '0Af1o00001S6zTp'}]};
    const conTarget = this.org.getConnection();
    const org: Organization = await fnGetOrganization(conTarget);


    const appcentral = await Org.create({
        aliasOrUsername: this.flags.appcentral
      });
    const conAC = appcentral.getConnection();

    // ### retrieve environment id
    const env: IFQuery = {conn: conAC, object: ENV['object'], field: ['Id', ENV['orgid']], where: ENV['orgid'] + '='  + '\'' + org.Id + '\''};
    const recenv = await conAC.query<IFsobject>(await fnBuildSoql(env));
    const envid = recenv.records[0].Id;

    // ### Retrieve the Pending and New Deployments
    const envrelease: IFQuery = {conn: conAC, object: RELEASE_ENV['object'], field: ['Id',RELEASE_ENV['deployid']], where: RELEASE_ENV['envid'] + '=' + '\'' + envid + '\'' + ' AND ' + RELEASE_ENV['status'] + ' IN (\'Pending\',\'New\')'};
    const recenvrelease = await conAC.query<IFsobject>(await fnBuildSoql(envrelease));

    const lenvrelease = new Array();
    for (const f of recenvrelease.records) {
      const deployid = f[RELEASE_ENV['deployid']];
      const deploystatus = await conTarget.metadata.checkDeployStatus(deployid, false);

      lenvrelease.push({Id: f.Id, [RELEASE_ENV['status']]: deploystatus['status']});

      this.ux.log('UPDATING DEPLOY JOB:' + f['Id']);

    }

    const p = await conAC.update(RELEASE_ENV['object'], lenvrelease);

    if (fnResultError(p)) {
      this.ux.log ('Error updating DeployRequest Id');
      for (const f of fnResultErrorMsg(p)) {
        this.ux.log('index: ' + f.idx + ' - ' + f.message);
      }
    }

    return null;
  }
}
