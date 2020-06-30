Puppeteer to grabb DeployRequests
=================================

sfdx update

git clone git@github.com:cgsmeets/Deployrequest.git

cd Deployrequest

yarn install

open -a "Visual Studio Code" .

./bin/run DeployRequest:List -u <your org> 

OUTPUT
======
----------------- PENDING ------------------------

0Af5I0000000001

----------------- FAILED ------------------------

0Af5I0000012345

0Af5I0000012348

----------------- SUCCESS ------------------------

0Af5I000003IeAI