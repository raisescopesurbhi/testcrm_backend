const CFgenerateRandomNumber = () => {
    const digits = process.env.MT5_DIGIT;
    if (!digits || digits <= 0) throw new Error("Digits must be a positive number");
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  module.exports = CFgenerateRandomNumber;
  