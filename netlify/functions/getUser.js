
// netlify/functions/getUser.js
const { getUser } = require("../../taskHandlers");

exports.handler = async (event) => {
  return new Promise((resolve) => {
    const mockReq = { params: { code: event.queryStringParameters.code } };
    const mockRes = {
      status: (code) => ({
        json: (obj) => resolve({ statusCode: code, body: JSON.stringify(obj) })
      }),
      json: (obj) => resolve({ statusCode: 200, body: JSON.stringify(obj) })
    };
    getUser(mockReq, mockRes);
  });
};
