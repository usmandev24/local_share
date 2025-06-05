import * as http from "node:http";
import * as fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createWriteStream } from "node:fs";
import * as url from "node:url";
import { stat } from "node:fs/promises";

const server = http.createServer();
const port = 4040;
const notFound = `
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
</html>`
server.on("request", (req, res) => {
  if (req.url == "/favicon.ico") {
    res.end();
  } else handleRouts(req, res);
});

function handleRouts(req, res) {
  let path = url.parse(req.url, true);
  let pathname = path.pathname;

  if (pathname === "/") {
    renderHome(req, res);
  }
  else if (pathname.startsWith("/local")) {
    routLocal(req, res);
  } else if (pathname === "/client") {
    renderClient(req, res);
  } else if (pathname.startsWith("/client/upload")) {
    routUpload(req, res);
  } else {
    res.end(notFound);
console.log("404  Forbiddin GET: " + req.url);
  }
}


async function routLocal(req, res) {
  const reqURL = req.url;
  let path;
  if (reqURL === "/local") {
    path = "." + decodeURIComponent(reqURL.slice(6)) + "/";
  } else path = "." + decodeURIComponent(reqURL.slice(6));
  
  let stats = await checkStats(path);
  let isdir ;
  try {
    isdir = stats.isDirectory();
  } catch {
    isdir = false;
  }
  if (isdir) {
    let dir = fs
      .readdir(path)
      .then(async (data) => {
        res.writeHead(200, { "content-type": "text/html" });
        let base = reqURL;
        if (reqURL === "/local") base = "local";
        let preDir = "";

        let mapedDir = path.slice(2).split("/");
        mapedDir = mapedDir.map((value, i) => {
          preDir +="/"+ encodeURIComponent(value);
          return `<a class ="nav" href = "${"/local" + preDir}">${value}</a>`;
        }).join(" / ");

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
              background-color :rgb(175, 175, 175) ;
              color : white;
            }
            a {
              text-decoration : none;
            }
            body {
              background-color :rgb(195, 195, 195);
              margin: 0.5rem 1rem;
            }
            .nav {
              background-color:rgb(250, 223, 149);
              border-radius: 3px;
              padding:0 1px;
              padding-bottom : 0;
              margin: 1px;
              border-bottom : 1px solid gray;
              
            }
            .files  {
              background-color:rgb(246, 241, 241);
              border-radius: 3px;
              padding: .1rem .5rem;
              margin: .5rem;
              margin-left: .5rem;
              width: max-content;
            }
            h4 {
             background-color: rgb(164, 164, 164);
             padding :.2rem;
             border-radius: 3px;
            }
            .yellow {
              background-color:rgb(250, 247, 89);
            }
            .files>a {
              color:black;
            }
        </style>
        <body>
        <h1 class = "home">
         <a  href="/" >LocalShare</a>
        </h1>
        <h4>${'./<a class ="nav" href="/local"> local </a>'+' / '+mapedDir}</h4>
        `);

        for (let i = 0; i < data.length; i++) {
          let stats = await checkStats(path+"/"+data[i]);
          let color = "white";
          try {
            if (stats.isDirectory()) color = "yellow"
          } catch {

          }
          res.write(`
          <h3 class = "files ${color}">
          <a  href="${base + "/" + data[i]}">${data[i]} </a>
          </h3>`);
        }
        res.end(`
        </body>
        </html>
        `);
        console.log("200  OK  GET: "+req.url);
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
        console.log("200  OK  GET: "+req.url);
      })
      .catch((error) => {
        res.end(notFound);
        console.log("404  Forbiddin GET: " + req.url);
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
    margin-top: 1rem;
    background-color: rgb(175, 175, 175);
    text-align: center;
  }
  a {
    text-decoration: none;
    background: lightgray;
    border-radius: 3px;
    padding: .2rem;
    
  }
</style>
<body>
  <h1>Local Share</h1>
  <h3>
    <a href="/local" >Get Local files (pc on which server runing).</a>
  </h3>
  <h3>
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
    </form>
    <h3> Still in work.... </h3>
  </body>
</html>
`)
}

async function checkStats(path) {
  let stats;
  try {
    stats = await stat(path);
  } catch (error) {
    
    return { status: 404, body: "File not found" };
  }
  return stats
}
import * as os from "os";

function getIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address
        });
        console.log(`open brower in your mobile and go to: "${iface.address}:${port}"`)
      }
    }
  }

  return addresses;
}

getIPv4Addresses()

server.listen(port);
console.log(`Server is listing at http://localhost:${port}`);
