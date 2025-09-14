
// apiConfig.js
// Chooses the right API base URL depending on environment

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:3000/api"   // local Express
  : "/.netlify/functions";        // Netlify functions

export default API_BASE;
