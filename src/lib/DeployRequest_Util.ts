import { Connection, SfdxError } from '@salesforce/core';
import { DEBUG_FLAG, IFerror, IFQuery, Organization } from './DeployRequest_Def';


async function fnBuildSoql(v: IFQuery): Promise <string> {

    let q: string = 'select ';
    if (v.field == null) {
      v.field = new Array<string>();
      const des = await v.conn.describe(v.object);
      for (const ff of des['fields']) {
        v.field.push(ff.name);
      }
      if (v.field.length === 0) v.field.push('Id');
    }

    q += v.field.join(',') + ' from ' + v.object;
    if (v.where != null ) q += ' where ' + v.where;
    if (v.limit != null) q += ' limit ' + v.limit.toString();

    return q;
  }

async function fnGetOrganization(conn: Connection): Promise<Organization> {
  let res: Organization;
  const query = 'SELECT Id, Name, OrganizationType, InstanceName, NamespacePrefix, IsSandbox, CreatedDate, CreatedBy.username FROM Organization';

  const r = await conn.query<Organization>(query);
  if (!r.records || r.records.length <= 0) {
    throw new SfdxError('No Organization record found');
  }

  res = r.records[0];

  return res;

}

export function fnLog(msg: string): void {
  if (DEBUG_FLAG) {
    console.log(msg);
  }
}

export function fnResultError(v): boolean {
  let res: boolean = false;

  for (const f of v) {
    res = res || f['error'];
  }
  return res;
}

export function fnResultErrorMsg(v): IFerror[] {
  const res: IFerror[] = new Array();
  let idx: number = 0;
  for (const f of v) {
    if (f['error']) {
      res.push({idx, message: f['errormessage']});
    }
    idx++;
  }
  return res;
}

export {fnGetOrganization, fnBuildSoql};
