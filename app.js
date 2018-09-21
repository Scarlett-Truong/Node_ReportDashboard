const express = require('express')
const app = express()
const jsonData = require('./myfile.json');
const Json2csvParser = require('json2csv').Parser;
const fs = require('fs');
const {google} = require('googleapis');
const drive = google.drive("v3");
const key = require("./private_key.json");
const path = require("path");
const axios = require('axios');

//------------------GTMETRIX API-------------------------------
/*
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

// Poll test every 5 seconds for completion, then log the result
gtmetrix.test.create (testDetails).then (data =>
  gtmetrix.test.get(data.test_id, 5000).then(response => {
    gtm.loadTime = response.results.fully_loaded_time/1000;
    gtm.pageSize = response.results.page_bytes/1000;
    gtm.requests = response.results.page_elements;
    console.log(gtm.loadTime);
    console.log(response);
    return gtm;
  }));

console.log(gtm);  
*/

//------------------WEBPAGETEST API-------------------------------
axios.get()


/*
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
                "Speed Index",
                "Time To Interact",
                "Fully Loaded Time",
                "Total Page Size",
                "Requests",
                "Pages Image Score",
                "URL",
                "Total Images Analyzed",
                "Total Images Weight",
                "Start Render",
                "Speed Index",
                "Time",
                "kBytes",
                "Document Completed" ];
const myReport = [
  {
    "Date": new Date(),
    "Speed Index": jsonData.audits["speed-index"].displayValue,
    "Time To Interact": jsonData.audits.interactive.displayValue,
    "Fully Loaded Time": "",
    "Total Page Size": "",
    "Requests": "",
    "Pages Image Score": "",
    "URL": "",
    "Total Images Analyzed": "",
    "Total Images Weight": "",
    "Start Render": "",
    "Speed Index": "",
    "Time": "",
    "kBytes": "",
    "Document Completed": "",
  }, 
  {
    "name": jsonData.audits["speed-index"].title,
    "type": "numeric",
    "value": jsonData.audits["speed-index"].displayValue
  }, 
  {
    "name": jsonData.audits.interactive.title,
    "type": "numeric",
    "value": jsonData.audits.interactive.displayValue
  }
];
 
const json2csvParser = new Json2csvParser({ fields });
const csv = json2csvParser.sparse(myReport);
 
console.log(csv);

fs.writeFile('name.csv', csv, function (err) {
    if (err) {
        return console.log(err);
    }
    console.log('FILE SUCCESSFULLY WRITTEN!\n');
});


var folderId = "1-pkCn-ryOCPL8RAsi2j8SwPa9RYNNx6Q";
var fileMetadata = {
    'name': 'My Report',
    'mimeType': 'application/vnd.google-apps.spreadsheet',
    parents: [folderId]
};
var media = {
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
*/

/*
app.get('/', (req, res) => {
    //res.send(jsonData.audits["is-on-https"].id);
    res.send(new Date());
});
*/


app.listen(3700, () => console.log('Example app listening on port 3500!'));