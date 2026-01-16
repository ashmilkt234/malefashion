const User = require("../../models/userSchema");

// Load Users
const userInfo = async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    const searchFilter = search
      ? {
          isAdmin: false,
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } }
          ]
        }
      : { isAdmin: false };

    const totalUsers = await User.countDocuments(searchFilter);
    const totalPages = Math.ceil(totalUsers / limit);

    const users = await User.find(searchFilter)
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.render("admin/user", {
      users,
      search,
      totalPages,
      limit,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit)
    });

  } catch (error) {
    console.log("Load users error:", error);
    res.redirect("/admin/error?message=User load error");
  }
};

// Block User
const userBlocked = async (req, res) => {
  try {
    const id = req.params.id;   

    await User.findByIdAndUpdate(id, { isBlocked: true });

    res.json({ success: true }); 
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};

// Unblock User
const userunBlocked = async (req, res) => {
  try {
    const id = req.params.id;   

    await User.findByIdAndUpdate(id, { isBlocked: false });

    res.json({ success: true }); 
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false });
  }
};
module.exports ={
   userunBlocked, userBlocked,userInfo
}
