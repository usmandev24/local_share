import * as http from "node:http";
import * as fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createWriteStream } from "node:fs";
import * as url from "node:url";
import { stat } from "node:fs/promises";

const server = http.createServer();

server.on("request", (req, res) => {
  if (req.url == "./favicon.ico") {
    res.end();
  } else handleRouts(req, res);
});

function handleRouts(req, res) {
  let path = url.parse(req.url, true);
  let pathname = path.pathname;
  console.log(pathname);
  if (pathname === "/") {
    renderHome(req, res);
  }
  else if (pathname.startsWith("/local")) {
    routLocal(req, res);
  } else if (pathname.startsWith("/client")) {
    renderClient(req, res);
  } else {
    res.end(`
      <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404</title>
  </head>
  <style>
  h1 {
  text-align  : center;
  }
  </style>
  <body>
    <h1> 404 <br> Not valid Path</h1>
  </body>
</html>`)
  }
}

async function routLocal(req, res) {
  const reqURL = req.url;
  let path;
  if (reqURL === "/local") {
    path = "." + decodeURIComponent(reqURL.slice(6)) + "/";
  } else path = "." + decodeURIComponent(reqURL.slice(6));
  let stats;
  try {
    stats = await stat(path);
  } catch (error) {
    if (error.code != "ENOENT") throw error;
    else return { status: 404, body: "File not found" };
  }
  if (stats.isDirectory()) {
    let dir = fs
      .readdir(path)
      .then((data) => {
        res.writeHead(200, { "content-type": "text/html" });
        let base = reqURL;
        if (reqURL === "/local") base = "local";
        res.write(`
        <html>
        <head>
          <title>Local server File system</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Local Share</title>
        </head>
        <style>
           .home {
              text-align : center;
              background-color :rgb(26, 25, 25) ;
              color : white;
  
            }
            a {
              text-decoration : none;
            }
        </style>
        <body>
        <h1 class = "home">
         <a  href="/" >LocalShare</a>
        </h1>
        <h2>${path}</h2>
        `);
        for (let i = 0; i < data.length; i++) {
          res.write(`
          <h3>
          <a href="${base + "/" + data[i]}">${data[i]} </a>
          </h3>`);
        }
        res.end(`
        </body>
        </html>
        `);
      })
      .catch((error) => {
        res.end("No such file or Directory");
        console.log(error);
      });
  } else {
    let file = fs
      .readFile(path)
      .then((data) => {
        res.end(data);
      })
      .catch((error) => {
        res.end("Error");
      });
  }
}
function renderHome(req, res) {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(`
    <html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local Share</title>
</head>
<style>
  h1 {
    text-align: center;

  }
  body {
    margin: 2rem;
    background-color: purple;
  }
  a {
    text-decoration: none;
    background: lightgray;
    border-radius: 3px;
    padding: 0.4rem;
  }
</style>
<body>
  <h1>Local Share</h1>
  <h3>
    <a href="/local" >Get Local files (pc on which server runing).</a><br><br>
    <a href="/client"> Send Client files to Local.</a>
  </h3>
  <p>Share files semelessly between you your devices on local network.<p>
</body>
</html>
    `);
}

function renderClient(req, res) {
  res.end(`
    <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Local Share</title>
  </head>
  <style>
    h1 {
      text-align: center;
      background: lightgray;
      border-radius: 3px;
      padding: 0.4rem;
    }
    body {
      margin: 2rem;
      margin-top: 0.5rem;
      background-color: rgb(243, 220, 255);
      text-align: center;
    }
    a {
      text-decoration: none;
    }
    form {
      font-size: 1.5rem;
    }
    input {
      font-size: 1rem;
      border-radius: 3px;
      margin: 0.4rem;
    }
  </style>
  <body>
    <h1><a href="/">LocalShare</a></h1>
    <form>
      <label for="filename"
        >Please Slect a file You want to send to Local pc.<br /><br />
        <input id="filename" type="file"
      /></label>
      <br />
      <input onclick="uploadFile()" type="submit" />
    </form>
    <script>
      function uploadFile() {
        let fileInput = document.getElementById("filename");
        const file = fileInput.files[0];
        if (!file) alert("Please Slect a file first");
        let tofech = "/client/upload?filename="+ file.name;
        console.log(tofech)
        fetch(tofech, {
          method: "POST",
          body: file,
        })
          .then((res) => res.text())
          .catch((err) => alert(err));
      }
    </script>
  </body>
</html>
`)
}
server.listen(4000);
console.log("4000 listing");
