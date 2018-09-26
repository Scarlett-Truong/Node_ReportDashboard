const express = require('express')
//const app = express()
const jsonData = require('./myfile.json');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const {google} = require('googleapis');
const drive = google.drive("v3");
const key = require("./private_key.json");
const path = require("path");
//const axios = require('axios');
const WebPageTest = require('WebPageTest');
//const myUrl = 'www.cavellexcel.com';

//------------------GTMETRIX API-------------------------------
// promise
// Poll test every 5 seconds for completion, then log the result

const gtmetrix = require ('gtmetrix') ({
  email: 'truongt8@student.douglascollege.ca',
  apikey: 'eb5db35e7e792206a5c192b4dc1af037'
});
 
// Run test from London with Google Chrome
const testDetails = {
  url: 'http://www.cavellexcel.com/',
  location: 1,
  browser: 3
};

let gtm = {
  loadTime: 0,
  pageSize:0,
  requests: 0
};

const gtmResult = new Promise((resolve, reject) => {
  try{
    gtmetrix.test.create (testDetails).then (data =>
      gtmetrix.test.get(data.test_id, 5000).then(response => {
        gtm.loadTime = response.results.fully_loaded_time/1000;
        gtm.pageSize = response.results.page_bytes/1000;
        gtm.requests = response.results.page_elements;
        console.log("GTMetrix has been called");
        resolve(gtm);
      }));
  } catch (e) {
    reject(e);
  }
});

/*
gtmResult.then( (gtmValues) => {
  console.log('print new gtm values');
  console.log(gtmValues);
}).catch((e) => {
  console.log(e);
});
*/

/*
gtmResult.then((newGtm) => {
  console.log('print new gtm values');
  console.log(newGtm);
})
*/

//------------------WEBPAGETEST API-------------------------------

let wpt = {
  startRender: 0,
  speedIndex: 0,
  docTime: 0,
  docKBytes: 0,
  fullTime: 0,
  fullKBytes: 0
};

const wptApi = new WebPageTest('http://www.webpagetest.org/','A.dd2cd591e2905b1433d7ab0290cadbf8')
const wptResult = new Promise((resolve, reject) => {
  wptApi.runTest('http://www.cavellexcel.com', {
    connectivity: 'Cable',
    location: 'Dulles:Chrome',
    firstViewOnly: false,
    runs: 1,
    pollResults: 5,
    video: true
  }, function processTestResult(err, res) {
    wpt.startRender = res.data.median.firstView.render/1000;
    wpt.speedIndex = res.data.median.firstView.SpeedIndex;
    wpt.docTime = res.data.median.firstView.docTime/1000;
    wpt.docKBytes = res.data.median.firstView.bytesInDoc/1000;
    wpt.fullTime = res.data.median.firstView.fullyLoaded/1000;
    wpt.fullKBytes = res.data.median.firstView.bytesIn/1000;
    resolve(wpt);
  })
});
//wptResult.then(data => {console.log(data)})


//------------------OAUTH2 AUTHENTICATION-------------------------------
const jwToken = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key, ["https://www.googleapis.com/auth/drive"],
    null
  );
  
jwToken.authorize((authErr) => {
  if (authErr) {
    console.log("error : " + authErr);
    return;
  } else {
    console.log("Authorization accorded");
  }
});

//Create CSV object and save as CSV file
const fields = ["Date",
                "Lighthouse Speed Index",
                "Time To Interact",
                "GT Fully Loaded Time",
                "Total Page Size",
                "Requests",
                "Pages Image Score",
                "URL",
                "Total Images Analyzed",
                "Total Images Weight",
                "Start Render",
                "Speed Index",
                "Doc Completed Time",
                "Doc Completed kBytes",
                "Fully Loaded Time",
                "Fully Loaded kBytes" ];
        
gtmResult.then(gtmData => {
  wptResult.then(wptData => {
    const myReport = [
      {
        "Date": new Date(),
        "Lighthouse Speed Index": jsonData.audits["speed-index"].displayValue,
        "Time To Interact": jsonData.audits.interactive.displayValue,
        "GT Fully Loaded Time": gtmData.loadTime,
        "Total Page Size": gtmData.pageSize,
        "Requests": gtmData.requests,
        "Pages Image Score": "",
        "URL": "",
        "Total Images Analyzed": "",
        "Total Images Weight": "",
        "Start Render": wptData.startRender,
        "Speed Index": wptData.speedIndex,
        "Doc Completed Time": wptData.docTime,
        "Doc Completed kBytes": wptData.docKBytes,
        "Fully Loaded Time": wptData.fullTime,
        "Fully Loaded kBytes": wptData.fullKBytes,
      }
    ];
    
    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(myReport);
    //console.log(csv);
    fs.writeFile('name.csv', csv, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log('FILE SUCCESSFULLY WRITTEN!\n');
    });
    
    
    const folderId = "1-pkCn-ryOCPL8RAsi2j8SwPa9RYNNx6Q";
    const fileMetadata = {
        'name': 'My Report 2',
        'mimeType': 'application/vnd.google-apps.spreadsheet',
        parents: [folderId]
    };
    const media = {
      mimeType: 'text/csv',
      body: fs.createReadStream(path.join(__dirname, './name.csv'))
    };
    
    drive.files.create({
      auth: jwToken,
      resource: fileMetadata,
      media: media,
      fields: 'id'
    }, function(err, file) {
      if (err) {
        // Handle error
        console.error(err);
      } else {
        console.log('File Id: ', file.id);
      } 
    });
  });
})
