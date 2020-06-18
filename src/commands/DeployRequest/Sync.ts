import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, Org } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { IFListRes, IFQuery, IFsobject, DeployRequestRes, RELEASE_ENV, ENV } from '../../lib/DeployRequest_Def';
import { fnBuildSoql, fnResultError, fnResultErrorMsg } from '../../lib/DeployRequest_Util';
import { fnGetDeployRequest } from '../../core/DeployRequest_List';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('plugin2', 'org');

export default class Sync extends SfdxCommand {


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
    appcentral: flags.string({char: 'x', description: 'App central Org username or alias' })
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    const conndr = this.org.getConnection();
    const drr: DeployRequestRes = await fnGetDeployRequest(conndr);
    const orgdr: IFListRes = drr.toJSON();

    //const orgdr: IFListRes = {orgId: '00D24000000jjx3EAA', orgName: 'Salesforce', deployRequests: [{ status: 'pending', id: '0Af1o00001S6zTp'}]};

    const appcentral = await Org.create({
        aliasOrUsername: this.flags.appcentral
      });
    const conn = appcentral.getConnection();

    // ### retrieve environment id
    const env: IFQuery = {conn, object: ENV['object'], field: ['Id', ENV['orgid']], where: ENV['orgid'] + '='  + '\'' + orgdr.orgId + '\''};
    const recenv = await conn.query<IFsobject>(await fnBuildSoql(env));
    const envid = recenv.records[0].Id;

    const envrelease: IFQuery = {conn, object: RELEASE_ENV['object'], field: ['id',RELEASE_ENV['deployid']], where: RELEASE_ENV['envid'] + '=' + '\'' + envid + '\'' };
    const recenvrelease = await conn.query<IFsobject>(await fnBuildSoql(envrelease));

    envrelease.ids = new Set<string>();
    for (const f of recenvrelease.records) {
      envrelease.ids.add(f[RELEASE_ENV['deployid']]);
    }

    const lenvrelease = new Array();
    for (const f of orgdr.deployRequests) {
      if (!envrelease.ids.has(f.id)) {
        lenvrelease.push({[RELEASE_ENV['deployid']]: f.id, [RELEASE_ENV['envid']] : envid});
      }
    }

    const p = await conn.insert(RELEASE_ENV['object'], lenvrelease);

    if (fnResultError(p)) {
      this.ux.log ('Error insert new DeployRequest Id');
      for (const f of fnResultErrorMsg(p)) {
        this.ux.log('index: ' + f.idx + ' - ' + f.message);
      }
    }

    return lenvrelease;
  }
}
