"use strict";
const fs = require("fs-extra");
const { Files, Servers, Process } = require(`../Models`);
const { Sequelize, Op } = require("sequelize");
const { Google } = require(`../Utils`);

module.exports = async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) return res.json({ status: "false" });

    let row = await Files.Lists.findOne({
      raw: true,
      where: {
        slug,
        type: { [Op.or]: ["gdrive"] },
      },
    });
    if (!row) return res.json({ status: "false", msg: "not_exists" });
    let gSource = await Google.Source(row);
    let quality = [],
      vdo = {};
    for (const key in gSource) {
      if (gSource.hasOwnProperty.call(gSource, key)) {
        if (["1080", "720", "480", "360"].includes(key)) {
          quality.push(key);
          vdo[`file_${key}`] = gSource[key];
        }
      }
    }

    let cookie = gSource?.cookie
      .replace('","', ";")
      .replace('["', "")
      .replace('"]', "");

      let outPutPath = `${global.dirPublic}${slug}`

      if (!fs.existsSync(outPutPath)) {
        fs.mkdirSync(outPutPath, { recursive: true });
      }

    return res.json({
      status: "ok",
      quality,
      vdo,
      cookie,
      slug,
      outPutPath,
    });
  } catch (error) {
    return res.json({ status: "false" });
  }
};
