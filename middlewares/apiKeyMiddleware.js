const apiKeyMiddleware = (req, res, next) => {
  const clientApiKey = req.headers["x-api-key"];
  
  // Retrieve API key from headers

  console.log(clientApiKey);


  if (!clientApiKey) {
    return res.status(401).json({ message: "API key is missing" });
  }

  if (clientApiKey !== process.env.API_KEY) {
    return res.status(403).json({ message: "Invalid API key" });
  }

  


  console.log("Accessed API ____________________________");

  next(); // API key is valid, proceed to the next middleware/handler
};

module.exports = apiKeyMiddleware;
