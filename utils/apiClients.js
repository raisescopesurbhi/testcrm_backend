const axios = require("axios");

console.log("Meta API URL:", process.env.META_API_BASE_URL);

const metaApi = axios.create({
  baseURL: process.env.META_API_BASE_URL,
  withCredentials: false, // ✅ yahin set (headers me nahi)
   headers: {
   "x-api-key": process.env.META_API_KEY, // ✅ default header for all requests
    Accept: "application/json",
   },
});

// (Optional) Debug interceptors
metaApi.interceptors.request.use((config) => {
  // console.log("META REQUEST:", config.method?.toUpperCase(), config.baseURL + config.url);
  return config;
});

metaApi.interceptors.response.use(
  (res) => res,
  (err) => {
    // console.log("META ERROR:", err.response?.status, err.response?.data);
    return Promise.reject(err);
  }
);

module.exports = { metaApi };
