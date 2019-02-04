// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const { remote } = require("electron");
const path = require("path");
const shell = require("shelljs");
const Datastore = require("nedb");

const root = document.getElementById("root");

const baseDir = path.join(remote.app.getPath("desktop"), "biblioteca");
const biblioteca = new Datastore({
  filename: path.join(baseDir, "db", "biblioteca.nedb"),
  autoload: true
});
const prestiti = new Datastore({
  filename: path.join(baseDir, "db", "prestiti.nedb"),
  autoload: true
});
root.write("ciao");

prestiti.find({ ended: null }, (err, docs) => {
  docs.forEach(p =>
    biblioteca.findOne({ _id: p.book_id }, (err, book) => {
      if (book.in_house) {
        console.log(p._id, book._id, book.in_house);
        biblioteca.update(
          { _id: book._id },
          { $set: { in_house: false } },
          {},
          () => {
            biblioteca.persistence.compactDatafile();
          }
        );
      }
    })
  );
});

biblioteca.persistence.compactDatafile();

const destinationPath = path.join(
  remote.app.getPath("desktop"),
  "info-" + new Date().toISOString().split(".")[0]
);

shell.mkdir("-p", destinationPath);
shell.cp("-R", path.join(baseDir, ".logs"), destinationPath);
