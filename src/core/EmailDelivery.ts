import { Connection } from '@salesforce/core';
import { ElementHandle } from 'puppeteer';

async function fnUpdateDelivery(conn: Connection): Promise<string> {

    let res: string = '';

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

        await page.waitFor(100);

        console.log('Navigating to: Deliverability View');
        await page.goto(baseurl + '/lightning/setup/OrgEmailSettings/home');
        await page.waitForNavigation({waitUntil: 'networkidle0'});
        await page.waitFor(500);

        // ### Navigate to the form that has all the good stuff
        let url: string = null;
        const frm = await page.frames();
        for (const f of frm) {
            console.log(f.url());
            if (f.url().includes('editOrgEmailSettings')) {
                url = f.url();
            }
        }
        if (url == null) {
          throw new Error('No Email Settings page found');
        }
        console.log('Navigating to: ' + url);
        await page.goto(url);

        // ### get the element for the Access level
        const setting: ElementHandle = await page.$('#thePage\\:theForm\\:editBlock\\:sendEmailAccessControlSection\\:sendEmailAccessControl\\:sendEmailAccessControlSelect');

        // ### Option 2 is 'All Emails'
        await setting.select('2');

        // ### Locate the save button
        const savebutton: ElementHandle = await page.$('#thePage\\:theForm\\:editBlock\\:buttons\\:saveBtn');

        // ### Go and click it
        if (savebutton != null) {
          console.log('Click!');
          await savebutton.click({delay: 100});
          await page.waitForNavigation({waitUntil: 'networkidle0'});
          res = 'Email setting Updated';
        } else  {
          throw new Error('Oops no save button found');
        }

        // ### Take a screenshot as evidence
        await page.screenshot({path : './' + 'deliverabilitypage.png'});

        await browser.close();

    } catch (e) {
        if (browser != null) browser.close();
    }
    return res;
}

export {fnUpdateDelivery};
