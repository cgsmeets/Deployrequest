import { Connection } from '@salesforce/core';
import { ElementHandle, Page } from 'puppeteer';
import { isNullOrUndefined } from 'util';
import { DeployRequestRes, IFdeployrequest, IFlist } from '../lib/DeployRequest_Def';
import { fnGetOrganization } from '../lib/DeployRequest_Util';

async function fnEvaluateList(v1: Page, v2: string, v3: string): Promise <IFdeployrequest[]> {

    // MonitorDeploymentsPage:deploymentsForm:listFailed:FailedDeploymentsList:tb
    // #MonitorDeploymentsPage\\:deploymentsForm\\:listFailed\\:failedDeployPageNavigator\\:pageNavigatorComponent\\:nextPageLink

    // MonitorDeploymentsPage:deploymentsForm:listSucceeded:SucceededDeploymentsList:tb
    // #MonitorDeploymentsPage\\:deploymentsForm\\:listSucceeded\\:succeededDeployPageNavigator\\:pageNavigatorComponent\\:nextPageLink
    const msoreq = new Map<string, IFdeployrequest>();
    let ready = false;
    while (!ready) {

      const data = await fnParseList(v1, v2);
      for (const f1 of data) {
        msoreq.set(f1.id, f1);
      }

      const next: ElementHandle = await v1.$(v3);
      if (next != null) {

        await next.click({delay: 100});
        await v1.waitFor(500);
      } else {
        ready = true;
      }
    }

    const rdata = new Array<IFdeployrequest>();

    msoreq.forEach(itm => {rdata.push(itm); });
    return rdata;
  }

async function fnParseList(v1: Page, searchstr: string): Promise <IFdeployrequest[]> {

    const data = await v1.evaluate(isearchstr => {

      const items = document.getElementById(isearchstr);
      const lrequest = new Array<IFdeployrequest>();

      let litem;
      if (!(items == null || items === undefined)) {

        for (let i = 0 ; i < items.childElementCount; i++) {
          litem = items.children[i];

          const req: IFdeployrequest = {id: '', status: '', date: Date.now()};
          litem.childNodes.forEach(item => {
            const content: string = item.textContent != null ? item.textContent.substring(0, 40) : null;
            if (content.startsWith('0Af')) {
              req.id = content;
            }
          });
          lrequest.push(req);
       }
      }

      return lrequest;
    }, searchstr);

    return data;
  }

async function fnGetDeployRequest(conn: Connection): Promise<DeployRequestRes> {

    const res: DeployRequestRes = new DeployRequestRes(await fnGetOrganization(conn));

    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();

    try {
        const token = conn.accessToken;
        const baseurl = conn.instanceUrl;

        const page = await browser.newPage();
        let bloginsuccess: boolean = false;
        let iloginattempt: number = 0;

        while (!bloginsuccess &&  iloginattempt < 3) {
            try {
                iloginattempt++;

                console.log('Accessing Salesforce frontdoor - attempt: ' + iloginattempt);

                await page.goto(baseurl + '/secur/frontdoor.jsp?sid=' + token);
                await page.waitForNavigation({waitUntil: 'networkidle0'});
                bloginsuccess = true;
            } catch (e) {
                console.log('Login Failed on attempt: ' + iloginattempt.toString());
                console.log(e);
            }
        }
        if (!bloginsuccess) {
            throw new Error('All frontdoor login attempts failed');
        }

        await page.waitFor(500);

        console.log('Navigating to: Deploy Status View');
        await page.goto(baseurl + '/lightning/setup/DeployStatus/home');
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        let url: string = null;
        const frm = await page.frames();
        for (const f of frm) {
            if (f.url().includes('monitorDeployment')) {
                url = f.url();
            }
        }

        if (url == null) {
            throw new Error('No Monitor Deployment page found');
        }

        // url = url.replace('isdtp=p1', '');

        console.log('Navigating to: ' + url);
        await page.goto(url);
        await page.waitForSelector('body');
        await page.waitFor(500);

        const deploylists: IFlist[] = new Array( {name: 'Pending', table: 'MonitorDeploymentsPage:pendingDeploymentsList:tb', next: '#NoneExistingSelector'},
                                            {name: 'Failed', table: 'MonitorDeploymentsPage:deploymentsForm:listFailed:FailedDeploymentsList:tb', next: '#MonitorDeploymentsPage\\:deploymentsForm\\:listFailed\\:failedDeployPageNavigator\\:pageNavigatorComponent\\:nextPageLink'},
                                            {name: 'Success', table: 'MonitorDeploymentsPage:deploymentsForm:listSucceeded:SucceededDeploymentsList:tb', next: '#MonitorDeploymentsPage\\:deploymentsForm\\:listSucceeded\\:succeededDeployPageNavigator\\:pageNavigatorComponent\\:nextPageLink'} );

        for (const f of deploylists) {

            switch (f.name) {

                case 'Failed':
                res.failed = await fnEvaluateList(page, f.table, f.next);
                break;
                case 'Success':
                res.success = await fnEvaluateList(page, f.table, f.next);
                break;
                case 'Pending':
                res.pending = await fnEvaluateList(page, f.table, f.next);
                break;
                default:
                break;
            }

        }

        await browser.close();

    } catch (e) {
        console.log(e);
        res.error = true;
        if (!isNullOrUndefined(browser)) browser.close();
    }

    return res;
}

export {fnGetDeployRequest};
