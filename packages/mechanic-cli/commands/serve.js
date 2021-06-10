const express = require("express");
const path = require("path");
const fs = require("fs-extra");

const ora = require("ora");
const { mechanicSpinner, success } = require("./utils/spinners");

const command = async (argv) => {
  const spinner = ora({
    text: "Starting off server",
    spinner: mechanicSpinner,
  }).start();

  // Load config file
  const { configPath } = argv;
  const exists = await fs.pathExists(configPath);
  if (!exists) {
    spinner.fail(`Mechanic config file (${configPath}) not found`);
    return;
  }
  const config = require(path.join(process.cwd(), configPath));

  // Set port and express server
  const port = config.port ? config.port : argv.port;

  let status = "start-server";
  const app = express();

  app.use((req, res, next) => {
    if (status === "started") {
      next();
    } else {
      res.format({
        default: () =>
          res.sendFile(path.resolve(__dirname, "./html/loading.html")),
        "text/html": () =>
          res.sendFile(path.resolve(__dirname, "./html/loading.html")),
        "application/json": () => res.json({ loading: true, status }),
      });
    }
  });
  const { server } = await new Promise((resolve, reject) => {
    const server = app.listen(port, (error) => {
      if (error) {
        return reject(error);
      }
      return resolve({ server });
    });
  });
  spinner.succeed(`Server listening on port ${port}`);

  // Load webpack middleware to load mechanic app
  // app.use(middlewares);
  // Time simulation for now
  await new Promise((resolve) => setTimeout(resolve, 60000));

  // Done!
  status = "started";
  spinner.succeed(success(`Mechanic app ready at http://localhost:${port}`));
};

module.exports = {
  command: "serve [port] [configPath]",
  aliases: ["s"],
  desc: "Starts server for mechanic project",
  builder: (yargs) =>
    yargs.default("port", 3000).default("configPath", "mechanic.config.js"),
  handler: command,
};
