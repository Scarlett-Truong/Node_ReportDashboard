const jsonData = require('./myfile.json');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const {google} = require('googleapis');
const drive = google.drive("v3");
const key = require("./private_key.json");
const path = require("path");
const WebPageTest = require('WebPageTest');
const urlTest = 'https://www.novodentalcentre.com';
const folderId = "1kX5FpuwI9ACfqEzGfryA2D5UljZX2PWb";
const fileData = "novo-seo-report-data";
const fileGraph = "novo-seo-report-graph-data";

//------------------GTMETRIX API-------------------------------
// Poll test every 5 seconds for completion, then log the result
const gtmetrix = require ('gtmetrix') ({
  email: 'truongt8@student.douglascollege.ca',
  apikey: 'eb5db35e7e792206a5c192b4dc1af037'
});
// Run test from London with Google Chrome
const testDetails = {
  url: urlTest,
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
  wptAuth.runTest(urlTest, {
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
                "Speed Index (s)",
                "Time To Interact (s)",
                "Performance",
                "PWA",
                "Accessibility",
                "Best Practices",
                "SEO",
                "Page Speed Score",
                "YSlow Score",
                "GT Fully Loaded Time (s)",
                "Total Page Size (KB)",
                "Requests",
                "Start Render (s)",
                "Speed Index",
                "Doc Completed Time (s)",
                "Doc Completed kBytes",
                "Fully Loaded Time (s)",
                "Fully Loaded kBytes",
                "Pages Image Score",
                "URL",
                "Total Images Analyzed",
                "Total Images Weight" 
              ];

//Get current date               
const yyyymmdd = () => {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth() + 1;
  var d = now.getDate();
  return '' + y + (m < 10 ? '0' : '') + m + (d < 10 ? '0' : '') + d;
}

const callApi = async () => {
  const gtmData = await gtmApi;
  const wptData = await wptApi;

  const myReport = [{
    "Date": yyyymmdd(),
    "Speed Index (s)": (jsonData.audits["speed-index"].rawValue/1000).toFixed(2),
    "Time To Interact (s)": (jsonData.audits.interactive.rawValue/1000).toFixed(2),
    "Performance": jsonData.categories.performance.score,
    "PWA": jsonData.categories.pwa.score,
    "Accessibility": jsonData.categories.accessibility.score,
    "Best Practices": jsonData.categories["best-practices"].score,
    "SEO": jsonData.categories.seo.score,
    "Page Speed Score": gtmData.speedScore/100,
    "YSlow Score": gtmData.ySlow/100,
    "GT Fully Loaded Time (s)": gtmData.loadTime,
    "Total Page Size (Bytes)": gtmData.pageSize*100,
    "Requests": gtmData.requests,
    "Start Render (s)": wptData.startRender,
    "Speed Index": wptData.speedIndex,
    "Doc Completed Time (s)": wptData.docTime,
    "Doc Completed kBytes": wptData.docKBytes,
    "Fully Loaded Time (s)": wptData.fullTime,
    "Fully Loaded kBytes": wptData.fullKBytes,
    "Pages Image Score": "",
    "URL": "",
    "Total Images Analyzed": "",
    "Total Images Weight": "",
  },{
    "Date": yyyymmdd(),
    "Title": "Percent",
    "Performance": jsonData.categories.performance.score,
    "PWA": jsonData.categories.pwa.score,
    "Accessibility": jsonData.categories.accessibility.score,
    "Best Pracices": jsonData.categories["best-practices"].score,
    "SEO": jsonData.categories.seo.score,
    "Page Speed Score": gtmData.speedScore,
    "YSLow Score" : gtmData.ySlow
  },{
    "Date": yyyymmdd(),
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
  const strReport = `\n${myReport[0]["Date"]},${myReport[0]["Speed Index (s)"]},`
                      +`${myReport[0]["Time To Interact"]},${myReport[0]["Performance"]},`
                      +`${myReport[0]["PWA"]},${myReport[0]["Accessibility"]},`
                      +`${myReport[0]["Best Practices"]},${myReport[0]["SEO"]},`
                      +`${myReport[0]["Page Speed Score"]},${myReport[0]["YSlow Score"]},`
                      +`${myReport[0]["GT Fully Loaded Time"]},`
                      +`${myReport[0]["Total Page Size"]},${myReport[0]["Requests"]},`
                      +`${myReport[0]["Start Render"]},${myReport[0]["Speed Index"]},`
                      +`${myReport[0]["Doc Completed Time"]},${myReport[0]["Doc Completed kBytes"]},`
                      +`${myReport[0]["Fully Loaded Time"]},${myReport[0]["Fully Loaded kBytes"]},`
                      +`${myReport[0]["Pages Image Score"]},${myReport[0]["URL"]},`
                      +`${myReport[0]["Total Images Analyzed"]},${myReport[0]["Total Images Weight"]}`;
  //Write file with normal data
  if(fs.existsSync(`${fileData}.csv`)){
    fs.appendFile(`${fileData}.csv`, strReport, function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File append!\n');
    });
  }
  else {
    fs.writeFile(`${fileData}.csv`, csv, function (err) {
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
  if(fs.existsSync(`${fileGraph}.csv`)){
    fs.appendFile(`${fileGraph}.csv`, content.concat(contentRemain), function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File 2 append!\n');
    });
  }
  else {
    fs.writeFile(`${fileGraph}.csv`, header.concat(content).concat(contentRemain), function (err) {
      if (err) {
          return console.log(err);
      }
      console.log('File 2 successfully written!\n');
    });
  };

}).then(uploadToDrive => {
  
  //Uplaod file 1 with normal data
  const fileMetadata = {
      'name': fileData,
      'mimeType': 'application/vnd.google-apps.spreadsheet',
      parents: [folderId]
  };
  const media = {
    mimeType: 'text/csv',
    body: fs.createReadStream(path.join(__dirname, `./${fileData}.csv`))
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
    'name': fileGraph,
    'mimeType': 'application/vnd.google-apps.spreadsheet',
    parents: [folderId]
  };
  const media2 = {
    mimeType: 'text/csv',
    body: fs.createReadStream(path.join(__dirname, `./${fileGraph}.csv`))
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
