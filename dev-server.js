const express = require('express');
const bodyParser = require('body-parser');
const { existsSync } = require('fs')
const { handler } = require('./api/index')
const newman = require('newman');
const { URL } = require('url');

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
    "body": typeof request.body === 'string' ? request.body : JSON.stringify(request.body),
    "pathParameters": {},
    "isBase64Encoded": false,
    "stageVariables": {
      "stageVariable1": "value1",
      "stageVariable2": "value2"
    }
  }
}