import axios from "axios";

const baseURL = process.env.META_API_BASE_URL;
const copyURL=process.env.COPY_API_URL;

const apiKey = process.env.META_API_KEY;

if (!baseURL) throw new Error("META_API_BASE_URL missing");
if (!apiKey) throw new Error("META_API_KEY missing");
if (!process.env.MANAGER_INDEX) throw new Error("MANAGER_INDEX missing");

export const metaClient = axios.create({
  baseURL,
  headers: {
    // ⚠️ Header name depends on provider.
    // If your provider expects something else, change it here.
    "x-api-key": apiKey,
  },
});


export const copyClient = axios.create({
  baseURL: copyURL,
});
  







// Optional: some vendors use Authorization instead:
// metaClient.defaults.headers.Authorization = `Bearer ${apiKey}`;

