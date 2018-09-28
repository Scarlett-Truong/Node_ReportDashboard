const jsonData = require('./myfile.json');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const {google} = require('googleapis');
const drive = google.drive("v3");
const key = require("./private_key.json");
const path = require("path");
const WebPageTest = require('WebPageTest');
//const myUrl = 'www.cavellexcel.com';

//------------------GTMETRIX API-------------------------------
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
  requests: 0,
  speedScore: 0,
  ySlow: 0
};

const gtmApi = new Promise((resolve, reject) => {
  try{
    gtmetrix.test.create (testDetails).then (data =>
      gtmetrix.test.get(data.test_id, 5000).then(response => {
        gtm.loadTime = response.results.fully_loaded_time/1000;
        gtm.pageSize = response.results.page_bytes/1000;
        gtm.requests = response.results.page_elements;
        gtm.speedScore = response.results.pagespeed_score,
        gtm.ySlow = response.results.yslow_score
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

//------------------WEBPAGETEST API-------------------------------
let wpt = {
  startRender: 0,
  speedIndex: 0,
  docTime: 0,
  docKBytes: 0,
  fullTime: 0,
  fullKBytes: 0
};

const wptAuth = new WebPageTest('http://www.webpagetest.org/','A.dd2cd591e2905b1433d7ab0290cadbf8')
const wptApi = new Promise((resolve, reject) => {
  wptAuth.runTest('http://www.cavellexcel.com', {
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

const callApi = async () => {
  const gtmData = await gtmApi;
  const wptData = await wptApi;
  
  const myReport = [{
    "Date": new Date().toISOString(),
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
  },{
    "Date": new Date().toISOString(),
    "Title": "Percent",
    "Performance": jsonData.categories.performance.score,
    "PWA": jsonData.categories.pwa.score,
    "Accessibility": jsonData.categories.accessibility.score,
    "Best Pracices": jsonData.categories["best-practices"].score,
    "SEO": jsonData.categories.seo.score,
    "Page Speed Score": gtmData.speedScore,
    "YSLow Score" : gtmData.ySlow
  },{
    "Date": new Date().toISOString(),
    "Title": "Remain",
    "Performance": 1 - jsonData.categories.performance.score,
    "PWA": (1 - jsonData.categories.pwa.score),
    "Accessibility": 1 - jsonData.categories.accessibility.score,
    "Best Pracices": 1 - jsonData.categories["best-practices"].score,
    "SEO": 1 - jsonData.categories.seo.score,
    "Page Speed Score": 100 - gtmData.speedScore,
    "YSLow Score" : 100 - gtmData.ySlow
  }]
  return myReport;    
}

callApi().then(myReport => {
  const json2csvParser = new Json2csvParser({ fields });
  const csv = json2csvParser.parse(myReport[0]);
  const strReport = `\n${myReport[0]["Date"]},${myReport[0]["Lighthouse Speed Index"]},${myReport[0]["Time To Interact"]},${myReport[0]["GT Fully Loaded Time"]},${myReport[0]["Total Page Size"]},${myReport[0]["Requests"]},${myReport[0]["Pages Image Score"]},${myReport[0]["URL"]},${myReport[0]["Total Images Analyzed"]},${myReport[0]["Total Images Weight"]},${myReport[0]["Start Render"]},${myReport[0]["Speed Index"]},${myReport[0]["Doc Completed Time"]},${myReport[0]["Doc Completed kBytes"]},${myReport[0]["Fully Loaded Time"]},${myReport[0]["Fully Loaded kBytes"]}`;
  //Write file with normal data
  if(fs.existsSync('name.csv')){
    fs.appendFile('name.csv', strReport, function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File append!\n');
    });
  }
  else {
    fs.writeFile('name.csv', csv, function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File successfully written!\n');
    });
  }; 

  //Write file with data percentage
  const header = "Date,Title,Performance,PWA,Accessibility,Best Practices,SEO,Page Speed Score,YSLow Score";
  const content = `\n${myReport[1].Date},${myReport[1].Title},${myReport[1].Performance},${myReport[1].PWA},${myReport[1].Accessibility},${myReport[1]["Best Pracices"]},${myReport[1].SEO},${myReport[1]["Page Speed Score"]},${myReport[1]["YSLow Score"]}`;
  const contentRemain = `\n${myReport[2].Date},${myReport[2].Title},${myReport[2].Performance},${myReport[2].PWA},${myReport[2].Accessibility},${myReport[2]["Best Pracices"]},${myReport[2].SEO},${myReport[2]["Page Speed Score"]},${myReport[2]["YSLow Score"]}`;
  if(fs.existsSync('name2.csv')){
    fs.appendFile('name2.csv', content.concat(contentRemain), function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File 2 append!\n');
    });
  }
  else {
    fs.writeFile('name2.csv', header.concat(content).concat(contentRemain), function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File 2 successfully written!\n');
    });
  };

}).then(uploadToDrive => {
  const folderId = "1-pkCn-ryOCPL8RAsi2j8SwPa9RYNNx6Q";
  //Uplaod file 1 with normal data
  const fileMetadata = {
      'name': 'odws-seo-report-data',
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
    } });

  //Upload file 2 with percent data
  const fileMetadata2 = {
    'name': 'odws-seo-report-graph-data',
    'mimeType': 'application/vnd.google-apps.spreadsheet',
    parents: [folderId]
  };
  const media2 = {
    mimeType: 'text/csv',
    body: fs.createReadStream(path.join(__dirname, './name2.csv'))
  };

  drive.files.create({
    auth: jwToken,
    resource: fileMetadata2,
    media: media2,
    fields: 'id'
  }, function(err, file) {
    if (err) {
      // Handle error
      console.error(err);
    } else {
      console.log('File Id: ', file.id);
    } });

});
/*
callApi().then( result => {
  myReport.push(result);
  return myReport;
}).then(myReport => {
  return JSON.stringify(myReport)
}).then(myReport => console.log(myReport));
*/

/*
const json2csvParser = new Json2csvParser({ fields });
const csv = json2csvParser.parse(myReport);


//Write file
fs.appendFile('name.csv', csv, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log('File append!\n');
});
*/
/*

//Put file in Google Drive
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
  } });

*/
 
/*
gtmResult.then(gtmData => {
  wptResult.then(wptData => {
    const reportObj = {
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
    let myReport = [];
    myReport.push(reportObj);
    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(myReport);
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
*/