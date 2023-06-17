process.chdir('./api');
const express = require('express');
const bodyParser = require('body-parser');
const { existsSync } = require('fs')
const { handler } = require('./api/index')
const newman = require('newman');
const { URL } = require('url');
const qs = require('querystring');

console.log(process.env.JIRA_API_TOKEN);
const app = express();
app.use(express.json());
app.use(bodyParser.urlencoded());
const port = 8001;

let server = null;

app.post('/2015-03-31/functions/function/invocations', async (req, res) => {
  try {
    const body = req.body ? JSON.parse(req.body) : ExpressToAWSAPIGatewayProxyEventV2(req);
    handler(body, {}).then(result => {
      res.send(result);
    }).catch(error => console.error(error));
  } catch (error) {
    console.error('app.post invocations Error', error);
    console.log(req);
    res.send("Error");
  }
})

app.post('*', async (req, res) => {
  handler(ExpressToAWSAPIGatewayProxyEventV2(req), {}).then(result => {
    result.headers && Object.keys(result.headers).forEach(headerName => {
      res.setHeader(headerName, result.headers[headerName]);
    });
    res.status(result.statusCode || 500).send(result.body);
  }).catch(error => {
    console.error('app.all * Error', error)
    res.send("Error");
  });
});

server = app.listen(port, () => {
  console.log(`
  Example app listening at: 
    POST http://localhost:${port}/2015-03-31/functions/function/invocations
  `);

  if (process.argv[2]) {
    const testFilename = process.argv[3] || 'service-collection.postman_collection.json'

    if (!existsSync(`./${testFilename}`)) {
      console.log('Running Newman tests');
      console.error(`Error: test collection not found
        ./${testFilename}
      
        Skipping tests. Running dev server only.
      `);

      return;
    }
    console.log('Test collection:', testFilename);

    newman.run({
      collection: require(`./${testFilename}`),
      reporters: 'cli',
    },
      (err, summary) => {
        if (err) {
          console.log(err);
          process.exit(1)
        }
        process.exit();
      })
  }
})

function ExpressToAWSAPIGatewayProxyEventV2(request) {

  const expectBody = "ZmllbGRMYWJlbHM9JTVCJTdCJTIybGFiZWwlMjIlM0ElMjJQYXJ0aWNpcGFudCtJbmZvcm1hdGlvbiUyMiUyQyUyMmZpZWxkcyUyMiUzQSU3QiUyMk5hbWUlMjIlM0ElMjJwYXJ0aWNpcGFudC5uYW1lJTIyJTJDJTIyUGhvbmUlMjIlM0ElMjJwYXJ0aWNpcGFudC5waG9uZSUyMiUyQyUyMkVtYWlsJTIyJTNBJTIycGFydGljaXBhbnQuZW1haWwlMjIlMkMlMjJBZGRyZXNzJTIyJTNBJTIycGFydGljaXBhbnQuYWRkcmVzcyUyMiU3RCU3RCUyQyU3QiUyMmxhYmVsJTIyJTNBJTIyTkRJUytJbmZvcm1hdGlvbiUyMiUyQyUyMmZpZWxkcyUyMiUzQSU3QiUyMk5ESVMrTnVtYmVyJTIyJTNBJTIybmRpcy5udWJlciUyMiUyQyUyMlN0YXJ0K0RhdGUlMjIlM0ElMjJuZGlzLnN0YXJ0JTIyJTJDJTIyRW5kK0RhdGUlMjIlM0ElMjJuZGlzLmVuZCUyMiU3RCU3RCUyQyU3QiUyMmxhYmVsJTIyJTNBJTIyUGVyc29uK2NvbXBsZXRpbmcrdGhpcytmb3JtJTIyJTJDJTIyZmllbGRzJTIyJTNBJTdCJTIyTmFtZSUyMiUzQSUyMnBlcnNvbi5uYW1lJTIyJTJDJTIyUGhvbmUlMjIlM0ElMjJwZXJzb24ucGhvbmUlMjIlMkMlMjJFbWFpbCUyMiUzQSUyMnBlcnNvbi5lbWFpbCUyMiUyQyUyMkFkZHJlc3MlMjIlM0ElMjJwZXJzb24uYWRkcmVzcyUyMiU3RCU3RCUyQyU3QiUyMmxhYmVsJTIyJTNBJTIyUGFydGljaXBhbnQlMjdzK1N1cHBvcnQrY29vcmRpbmF0b3IlMjIlMkMlMjJmaWVsZHMlMjIlM0ElN0IlMjJOYW1lJTIyJTNBJTIyc3VwcG9ydGNvLm5hbWUlMjIlMkMlMjJQaG9uZSUyMiUzQSUyMnN1cHBvcnRjby5waG9uZSUyMiUyQyUyMkVtYWlsJTIyJTNBJTIyc3VwcG9ydGNvLmVtYWlsJTIyJTJDJTIyQWRkcmVzcyUyMiUzQSUyMnN1cHBvcnRjby5hZGRyZXNzJTIyJTdEJTdEJTJDJTdCJTIybGFiZWwlMjIlM0ElMjJPdGhlcitJbmZvcm1hdGlvbiUyMiUyQyUyMmZpZWxkcyUyMiUzQSU3QiUyMkFueStjdWx0dXJhbCtuZWVkcyUzRiUyMiUzQSUyMm90aGVyLmN1bHR1cmFsJTIyJTJDJTIyQW55K2FkZGl0aW9uYWwrbmVlZHMlM0YlMjIlM0ElMjJvdGhlci5hZGRpdGlvbmFsJTIyJTdEJTdEJTVEJnBhcnRpY2lwYW50Lm5hbWU9TWFubWVldCtLYXVyJnBhcnRpY2lwYW50LnBob25lPTkyMDU1ODc3NDAmcGFydGljaXBhbnQuZW1haWw9YmFsd2FudC5tYXRoYXJ1JTQwZ21haWwuY29tJnBhcnRpY2lwYW50LmFkZHJlc3M9Ri03JTJDK01hbnNhcm92ZXIrR2FyZGVuJm5kaXMubnVtYmVyPTEyMzQ1Njc4OTAmbmRpcy5zdGFydD0yMDIzLTA2LTAxJm5kaXMuZW5kPTIwMjMtMDYtMzAmcGVyc29uLm5hbWU9TVIrQkFMV0FOVCtTSU5HSCZwZXJzb24ucmVsYXRpb249U3BvdXNlJnBlcnNvbi5waG9uZT0lMkI2MTQ1MTI4Nzc0MCZwZXJzb24uZW1haWw9YmFsd2FudC5tYXRoYXJ1JTQwZ21haWwuY29tJnN1cHBvcnRjby5uYW1lPU1SK0JBTFdBTlQrU0lOR0gmc3VwcG9ydGNvLnBob25lPSUyQjYxNDUxMjg3NzQwJnN1cHBvcnRjby5lbWFpbD1iYWx3YW50Lm1hdGhhcnUlNDBnbWFpbC5jb20mc3VwcG9ydGNvLmFkZHJlc3M9NDIrV0FURVJCSVJEK0NDVCtXRUlSK1ZJRVdTK1ZJQyszMzM4Jm90aGVyLmN1bHR1cmFsPVNpa2hzK2FyZStwZW9wbGUrd2hvK3JlbGlnaW91c2x5K2FkaGVyZSt0bytTaWtoaXNtJTJDK2ErRGhhcm1pYytyZWxpZ2lvbit0aGF0K29yaWdpbmF0ZWQraW4rdGhlK2xhdGUrMTV0aCtjZW50dXJ5K2luK3RoZStQdW5qYWIrcmVnaW9uK29mK3RoZStJbmRpYW4rc3ViY29udGluZW50JTJDK2Jhc2VkK29uK3RoZStyZXZlbGF0aW9uK29mK0d1cnUrTmFuYWsuK1Npa2hzK2FyZStwZW9wbGUrd2hvK3JlbGlnaW91c2x5K2FkaGVyZSt0bytTaWtoaXNtJTJDK2ErRGhhcm1pYytyZWxpZ2lvbit0aGF0K29yaWdpbmF0ZWQraW4rdGhlK2xhdGUrMTV0aCtjZW50dXJ5K2luK3RoZStQdW5qYWIrcmVnaW9uK29mK3RoZStJbmRpYW4rc3ViY29udGluZW50JTJDK2Jhc2VkK29uK3RoZStyZXZlbGF0aW9uK29mK0d1cnUrTmFuYWsuK1Npa2hzK2FyZStwZW9wbGUrd2hvK3JlbGlnaW91c2x5K2FkaGVyZSt0bytTaWtoaXNtJTJDK2ErRGhhcm1pYytyZWxpZ2lvbit0aGF0K29yaWdpbmF0ZWQraW4rdGhlK2xhdGUrMTV0aCtjZW50dXJ5K2luK3RoZStQdW5qYWIrcmVnaW9uK29mK3RoZStJbmRpYW4rc3ViY29udGluZW50JTJDK2Jhc2VkK29uK3RoZStyZXZlbGF0aW9uK29mK0d1cnUrTmFuYWsuK1Npa2hzK2FyZStwZW9wbGUrd2hvK3JlbGlnaW91c2x5K2FkaGVyZSt0bytTaWtoaXNtJTJDK2ErRGhhcm1pYytyZWxpZ2lvbit0aGF0K29yaWdpbmF0ZWQraW4rdGhlK2xhdGUrMTV0aCtjZW50dXJ5K2luK3RoZStQdW5qYWIrcmVnaW9uK29mK3RoZStJbmRpYW4rc3ViY29udGluZW50JTJDK2Jhc2VkK29uK3RoZStyZXZlbGF0aW9uK29mK0d1cnUrTmFuYWsmb3RoZXIuYWRkaXRpb25hbD1TaWtoaXNtK2FuZCtIaW5kdWlzbSthcmUrZGlmZmVyZW50K2luK3RoZWlyK29yaWdpbnMlMkMrYmVsaWVmcyUyQythbmQrcHJhY3RpY2VzLitTaWtoaXNtK3dhcytmb3VuZGVkK2J5K0d1cnUrTmFuYWsrYWJvdXQrNTAwK3llYXJzK2FnbyUyQyt3aGlsZStIaW5kdWlzbStpcyt0aGUrb2xkZXN0K3JlbGlnaW9uK3dpdGgrbm8rc2luZ2xlK2ZvdW5kZXIxLitTaWtoaXNtK3RlYWNoZXMrdGhhdCt0aGVyZStpcytvbmx5K29uZStHb2QlMkMrd2hpbGUrSGluZHVpc20rZW5jb3VyYWdlcyt0aGUrd29yc2hpcCtvZittdWx0aXBsZStnb2RzK2FuZCtpZG9sczEuK1Npa2hpc20rcmVqZWN0cyt0aGUrYXV0aG9yaXR5K29mK3RoZStWZWRhcythbmQrdGhlK3ByaWVzdGx5K2NsYXNzJTJDK3doaWNoK2FyZStjZW50cmFsK3RvK0hpbmR1aXNtMS4rU2lraGlzbSthbHNvK3Byb21vdGVzK3RoZStjb25jZXB0K29mK2VxdWFsaXR5K3JlZ2FyZGxlc3Mrb2YrY2FzdGUlMkMrZ2VuZGVyJTJDK2NsYXNzJTJDK29yK2V0aG5pY2l0eSUyQyt3aGlsZStIaW5kdWlzbStoYXMrYStoaWVyYXJjaGljYWwrY2FzdGUrc3lzdGVtJnRlcm1zPW9u";

  const consturctedBody = Buffer.from(encodeURIComponent(qs.stringify(request.body))).toString('base64')

  console.log("consturctedBody", consturctedBody === expectBody);
  console.log("consturctedBody", consturctedBody.length, expectBody.length);
  const url = new URL(`http://server${request.originalUrl}`);
  return {
    "version": "2.0",
    "routeKey": "$default",
    "rawPath": request.path,
    "rawQueryString": url.search,
    "cookies": request.cookies,
    "headers": request.headers,
    "queryStringParameters": request.searchParameters,
    "requestContext": {
      "accountId": "123456789012",
      "apiId": "api-id",
      "authentication": {
        "clientCert": {
          "clientCertPem": "CERT_CONTENT",
          "subjectDN": "www.example.com",
          "issuerDN": "Example issuer",
          "serialNumber": "a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1",
          "validity": {
            "notBefore": "May 28 12:30:02 2019 GMT",
            "notAfter": "Aug  5 09:36:04 2021 GMT"
          }
        }
      },
      "authorizer": {
        "jwt": {
          "claims": {
            "claim1": "value1",
            "claim2": "value2"
          },
          "scopes": [
            "scope1",
            "scope2"
          ]
        }
      },
      "domainName": "id.execute-api.us-east-1.amazonaws.com",
      "domainPrefix": "id",
      "http": {
        "method": request.method,
        "path": url.pathname,
        "protocol": "HTTP/1.1",
        "sourceIp": "IP",
        "userAgent": "agent"
      },
      "requestId": "id",
      "routeKey": "$default",
      "stage": "$default",
      "time": "12/Mar/2020:19:03:58 +0000",
      "timeEpoch": Date.now()
    },
    "body": consturctedBody,
    "pathParameters": {},
    "isBase64Encoded": false,
    "stageVariables": {
      "stageVariable1": "value1",
      "stageVariable2": "value2"
    }
  }
}