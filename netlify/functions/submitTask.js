
// netlify/functions/submitTask.js
const { submitTask } = require("../../taskHandlers");

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  return new Promise((resolve) => {
    const mockReq = { body };
    const mockRes = {
      status: (code) => ({
        json: (obj) => resolve({ statusCode: code, body: JSON.stringify(obj) })
      }),
      json: (obj) => resolve({ statusCode: 200, body: JSON.stringify(obj) })
    };
    submitTask(mockReq, mockRes);
  });
};
