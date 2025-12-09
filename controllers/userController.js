const User = require("../models/user");
const bcrypt = require("bcrypt");
const { uploadBufferToCloudinary, cloudinary } = require("../utils/upload");

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash").lean();
    if (!user) return res.status(400).json({ msg: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("getUserById error", err);
    return res.status(500).json({ msg: "Server Error" });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error("getMyProfile error", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const updates = {};
    const { name, bio, interests, profilePicUrl, password, currentPassword } = req.body;

    const userExisting = await User.findById(req.user.id);
    if (!userExisting) return res.status(404).json({ msg: "User not found" });

    if (name) updates.name = String(name).trim();
    if (bio !== undefined) updates.bio = bio;
    if (profilePicUrl !== undefined) updates.profilePicUrl = profilePicUrl; // possibly external URL

    if (interests) {
      updates.interests = Array.isArray(interests)
        ? interests
        : String(interests).split(",").map((i) => i.trim()).filter(Boolean);
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ msg: "Current Password required to change the password" });
      }
      const isMatch = await bcrypt.compare(currentPassword, userExisting.passwordHash);
      if (!isMatch) return res.status(400).json({ msg: "Current password is incorrect" });
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(password, salt);
    }

    if (req.file && req.file.buffer) {
      try {
        const options = { folder: "wellness/profiles", resource_type: "image" };
        const result = await uploadBufferToCloudinary(req.file.buffer, options);
        if (userExisting.profilePicPublicId) {
          try {
            await cloudinary.uploader.destroy(userExisting.profilePicPublicId);
          } catch (delErr) {
            console.warn("Failed to delete old Cloudinary asset:", delErr.message || delErr);
          }
        }

        updates.profilePicUrl = result.secure_url;
        updates.profilePicPublicId = result.public_id;
      } catch (err) {
        console.error("Cloudinary upload failed", err);
        return res.status(500).json({ msg: "Image upload failed" });
      }
    } else if (profilePicUrl !== undefined && userExisting.profilePicPublicId) {
      try {
        await cloudinary.uploader.destroy(userExisting.profilePicPublicId);
      } catch (delErr) {
        console.warn("Failed to delete old Cloudinary asset:", delErr.message || delErr);
      }
      updates.profilePicPublicId = null;
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("-passwordHash").lean();
    return res.json({ user: updated });
  } catch (err) {
    console.error("UpdateMyProfileError", err);
    return res.status(500).json({ msg: "server error" });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const q = String(req.query.search || "").trim();
    const limit = Math.min(50, parseInt(req.query.limit || "10", 10));

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } }
      ];
    }
    const users = await User.find(filter).select("name email profilePicUrl bio").limit(limit).lean();
    return res.json({ users });
  } catch (err) {
    console.error("search user error", err);
    return res.status(500).json({ msg: "Server Error" });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user.id;

    if (targetId === meId) return res.status(400).json({ msg: "Cannot follow yourself" });

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ msg: "User not found" });

    targetUser.followers = targetUser.followers || [];
    const me = await User.findById(meId);
    me.following = me.following || [];

    const alreadyFollowing = targetUser.followers.some((id) => id.toString() === meId);

    if (alreadyFollowing) {
      // remove
      targetUser.followers = targetUser.followers.filter((id) => id.toString() !== meId);
      me.following = me.following.filter((id) => id.toString() !== targetId);
    } else {
      // add
      targetUser.followers.push(meId);
      me.following.push(targetId);
    }

    await targetUser.save();
    await me.save();

    return res.json({ followed: !alreadyFollowing });
  } catch (err) {
    console.error("toggleFollow error", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
