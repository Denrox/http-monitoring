# HTTP Monitoring
This tool fetches resources specified in your config and compares responses to expectation specified in you config.  
Results are output in stdout and sent to telegram.  
This tool can be run as a cron task.

## Installation (Without Docker)
* git clone git@github.com:Denrox/http-monitoring.git
* cd http-monitoring
* npm install
* node index.js --config=./config-example/config.json

## Config file explanation
```
{
  "chatId": "123362312", // Telegram Chat ID
  "telegramKey": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11", // Telegram Bot Key
  "resources": [
    {
      "url": "https://sample.com", // URL for checking
      "redirects": 0, // How Many redirects to follow before verifying result with expectations
      "method": "GET", // GET | POST | PATCH | PUT | DELETE
      "expect": {
        "status": 302, // Expected Status Code
        "body": "Test Body", // Expected Response Body
        "headers": { "Location": "https://www.squadhelp.com/name/Sample?source=direct" } // Expected Headers
      }
    }
  ]
}
```