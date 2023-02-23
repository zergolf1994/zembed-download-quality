"use strict";

const { Files, Servers, Process } = require(`../Models`);
const { GetIP, getSets } = require(`../Utils`);
const { Sequelize, Op } = require("sequelize");
const shell = require("shelljs");

module.exports = async (req, res) => {
  try {
    const { slug } = req.query;

    if (!slug) return res.json({ status: false });
    const sv_ip = await GetIP();
    let sets = await getSets();

    let server = await Servers.Lists.findOne({
      raw: true,
      where: {
        sv_ip,
        active: 1,
        work: 0,
      },
    });

    if (!server) return res.json({ status: false, msg: "server_busy" });

    let row = await Files.Lists.findOne({
      raw: true,
      where: {
        slug,
        type: { [Op.or]: ["gdrive"] },
        s_convert: 0,
      },
    });
    if (!row) return res.json({ status: false, msg: "not_exists" });
    
    let data = {
      userId: row?.userId,
      serverId: server?.id,
      fileId: row?.id,
      type: "download-quality",
    };
    let db_create = await Process.create(data);

    if (db_create?.id) {
      await Files.Lists.update(
        { e_code: 1 },
        {
          where: { id: data.fileId },
          silent: true,
        }
      );
      await Servers.Lists.update(
        { work: 1 },
        {
          where: { id: data.serverId },
          silent: true,
        }
      );
      shell.exec(`sudo bash ${global.dir}/shell/download.sh ${slug}`, { async: false, silent: false }, function (data) {});
      return res.json({
        status: true,
        msg: `download-quality`,
      });
    } else {
      return res.json({ status: false, msg: `db_err` });
    }
  } catch (error) {
    console.log(error);
    return res.json({ status: false, msg: error.name });
  }
};
