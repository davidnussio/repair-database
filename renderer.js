const { remote } = require("electron");
const path = require("path");
const shell = require("shelljs");
const Datastore = require("nedb");

(async () => {
  const root = document.getElementById("root");

  const log = message => (root.innerHTML += message);

  const baseDir = path.join(remote.app.getPath("desktop"), "biblioteca");

  log("<h4>Starting repair tool...</h4>");
  log("<hr />");

  const backupPath = path.join(
    remote.app.getPath("desktop"),
    "backup-" + new Date().toISOString().split(".")[0]
  );
  log(`Starting dbs backup... (${backupPath})`);
  shell.mkdir("-p", backupPath);
  shell.cp("-R", path.join(baseDir, "db"), backupPath);
  log(" → [ FINITO ]");
  log("<hr />");

  const biblioteca = new Datastore({
    filename: path.join(baseDir, "db", "biblioteca.nedb"),
    autoload: true
  });

  const prestiti = new Datastore({
    filename: path.join(baseDir, "db", "prestiti.nedb"),
    autoload: true
  });

  const docs = await new Promise((resolve, reject) => {
    prestiti.find({ ended: null }, (err, docs) =>
      err ? reject(err) : resolve(docs)
    );
  });
  const problems = (await Promise.all(
    docs.map(
      p =>
        new Promise((resolve, reject) => {
          biblioteca.findOne({ _id: p.book_id }, (err, book) => {
            if (book.in_house) {
              log(
                `- È stato trovato un problema... (id libro: ${
                  book._id
                })<br /><br />`
              );
              biblioteca.update(
                { _id: book._id },
                { $set: { in_house: false } },
                {},
                () => {
                  biblioteca.persistence.compactDatafile();
                  resolve(book._id);
                }
              );
            } else {
              resolve();
            }
          });
        })
    )
  )).filter(id => id);

  console.log(problems);

  log("<hr />");

  log(`Copia file logs.... (${backupPath})`);
  shell.mkdir("-p", backupPath);
  shell.cp("-R", path.join(baseDir, ".logs"), backupPath);
  log(" → [ FINITO ]");

  log("<hr />");
  log("Chiudere questa applicazione e riaprire il programma della biblioteca");
})();
