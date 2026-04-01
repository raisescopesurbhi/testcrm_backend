const siteConfigModel = require("../models/admin/siteConfigModel");

// get site configs --------------

const getSiteConfigController = async (req, res) => {
  try {
    let data = await siteConfigModel.findOne(); // Get the first document
    if (!data) {
      // If no data exists, create a default entry
      data = await siteConfigModel.create({
        themeColor: "#6080FF",
      });
    }
    res.json({ msg: "All data retrieved", status: true, data });
  } catch (error) {
    console.log("error in retrieved Rules--", error);
  }
};

//  update platform --------------

const updateSiteConfigController = async (req, res) => {
  try {

    // Find and update the first document, or create it if not found
    const updateData = req.body;

    const updatedConfig = await siteConfigModel.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true }
    );

    res.json({ msg: "Site config updated", status: true, data: updatedConfig });
  } catch (error) {
    console.error("Error updating site config:", error);
    res.status(500).json({ msg: "Internal server error", status: false });
  }
};

module.exports = {
  getSiteConfigController,
  updateSiteConfigController,
};
