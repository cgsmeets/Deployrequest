import { Connection } from '@salesforce/core';
import { fnTest } from '../commands/DeployRequest/Test';
export const DEBUG_FLAG: boolean = false;
export const ENV = {object: 'Account', orgid: 'Name', sfdxalias: 'thkris1__sfdx_alias__c'};
export const RELEASE_ENV = {object: 'thkris1__testobject__c', envid: 'thkris1__Account__c', deployid: 'Name', status: 'thkris1__DeployStatus__c'};

export interface IFtestres {
    numFailures: string;
    numTestsRun: string;
    totalTime: string;
  }

export interface IFdeploystatus {
    checkonly: boolean;
    completedDate: string;
    CreatedBy: string;
    createdDate: string;
    done: boolean;
    id: string;
    numberComponentErrors: number;
    numberComponentsDeployed: number;
    numberComponentsTotal: number;
    numberTestErrors: number;
    numberTestsCompleted: number;
    numberTestsTotal: number;
    runTestsEnabled: boolean;
    status: string;
    success: boolean;
  }

export interface User {
    username: string;
  }

export interface Organization {
    Id: string;
    Name: string;
    OrganizationType: string;
    InstanceName: string;
    NamespacePrefix: string;
    IsSandbox: boolean;
    CreatedDate: Date;
    CreatedBy: User;
  }

export interface IFdeployrequest {
    id: string;
    status: string;
    date?: number;
  }

export interface IFlist {
    table: string;
    next: string;
    name: string;
    data?: IFdeployrequest[];
  }

export interface IFListRes {
      orgId: string;
      orgName: string;
      deployRequests: IFdeployrequest[];
  }

export interface IFQuery {
    conn: Connection;
    object: string;
    field?: string[];
    where?: string;
    limit?: number;
    ids?: Set<string>;
  }

export interface IFsobject {
      Id?: string;
      Name?: string;
      createddate?: number;
      createdby?: string;
      last_modifiedbydate?: number;
      last_modifiedby?: string;
  }

export interface IFerror {
      idx: number;
      message: string;
  }

class DeployRequestRes  {
    public error: boolean;
    public errormessage: string;
    public org: Organization;
    public pending: IFdeployrequest[];
    public failed: IFdeployrequest[];
    public success: IFdeployrequest[];

    constructor(v1: Organization) {
      this. error = false;
      this.org = v1;
      // this.deployrequests = new Array();
    }

    public toJSON() {
      const dr = new Array();

      if (this.pending != null) {
        for (const f of this.pending) {
          dr.push({status: 'pending', id: f.id});
        }
      }

      if (this.pending != null) {
          for (const f of this.failed) {
          dr.push({status: 'failed', id: f.id});
        }
      }

      if (this.success != null) {
        for (const f of this.success) {
          dr.push({status: 'success', id: f.id});
        }
      }

      const ret = {
        error: this.error,
        errormessage: this.errormessage,
        orgId: this.org.Id,
        orgName: this.org.Name,
        deployRequests: dr
      };

      return ret;

    }
  }

export { DeployRequestRes };
