const express = require('express')
const app = express()
const port = 3000
const multer  = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/process', upload.single('spreadsheet'), async function (req, res, next) {
  const spreadsheet = req.file;
  const form = new FormData();
  let responseMessage;

  form.append('file', spreadsheet.buffer, spreadsheet.originalname);

  try {
    const result = await axios.post('http://converter-service-app.default.svc.cluster.local/upload', form, { headers: form.getHeaders()});
    if (result.status === 200) {
      responseMessage = `${spreadsheet.originalname} was processed successfully!`;
    } else {
      responseMessage = `An error occured while processing ${spreadsheet.originalname}: ${result.statusText}`;
    }
  } catch (fileProcessError) {
    responseMessage = `An error occured while processing ${spreadsheet.originalname}: ${fileProcessError.message}`;
  }
  if (req.query.email) {
    await notifyUser(req.query.email, responseMessage);
  }

  res.send(responseMessage);
})

async function notifyUser(address, bodyText) {
  const result = {
    success: true,
    message: ""
  };

  const emailBody = {
    message: bodyText
  };

  try {
    const result = await axios.post('http://notification-service.default.svc.cluster.local/message/' + address, emailBody);
    if (result.status === 200) {
    } else {
      result.success = false;
      result.message = "Could not send notification email";
    }
  } catch (notificationError) {
    result.success = false;
    result.message = notificationError.message;
  }
  return result;
}

app.listen(port, () => {
  console.log(`Devcon Service listening on port ${port}`)
})

