const paymentMethodModel = require("../models/user/PaymentMethodModel");
const multer = require("multer");
const path = require("path");

// Configure Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/paymentMethod/"); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  },
}).single("image");

// add method --------------
const addPaymentMethodController = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res
        .status(400)
        .json({ msg: "Multer error", status: false, error: err });
    } else if (err) {
      console.log(err);
      return res
        .status(400)
        .json({ msg: "Error uploading file", status: false, error: err });
    }

    const {
      name,
      details,
      status,
      bankName,
      accountNumber,
      accountHolderName,
      ifscCode,
    } = req.body;

    try {
      const data = await paymentMethodModel.create({
        name,
        details,
        status,
        image: req.file ? req.file.path : undefined,
        bankTransfer: {
          bankName,
          accountNumber,
          accountHolderName,
          ifscCode,
        },
      });

      res.json({ msg: "Payment Method added", status: true, data });
    } catch (error) {
      console.log("error in add payment method--", error);
      res
        .status(500)
        .json({ msg: "Server error", status: false, error: error.message });
    }
  });
};


// get all platforms --------------

const getpaymentMethodsController = async (req, res) => {
  try {
    const data = await paymentMethodModel.find();
    res.json({ msg: "All payment methods retrieved", data });
  } catch (error) {
    console.log("error in retrieved paymnet methods--", error);
  }
};

//  update platform --------------

const updatePaymentMethodController = async (req, res) => {
  const { id, ...updateFields } = req.body;

  try {
    const userExist = await paymentMethodModel.findById(id);
    if (userExist) {
      const data = await paymentMethodModel.findByIdAndUpdate(
        id,
        {
          $set: updateFields,
        },

        { new: true, runValidators: true }
      );
      res.json({ msg: "payment method updated", status: true, data });
    }
    return res.json({ msg: "payment method not found", status: false });
  } catch (error) {
    console.log("error in update payment method--", error);
  }
};
//  delete platform --------------

const deletePaymentMethodController = async (req, res) => {
  const { id } = req.user.id; // Get the id from query parameters  //DeletePaymentMethod

  try {
    const userExist = await paymentMethodModel.findById(req.user.id);
    if (userExist) {
      const data = await paymentMethodModel.findByIdAndDelete(id);
      return res.json({ msg: "payment method deleted", status: true, data });
    }
    return res.json({ msg: "paymnet method not found", status: false });
  } catch (error) {
    console.log("error in delete payment method--", error);
    return res
      .status(500)
      .json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  addPaymentMethodController,
  getpaymentMethodsController,
  updatePaymentMethodController,
  deletePaymentMethodController,
};
