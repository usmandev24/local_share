import * as http from "node:http";
import * as fs from "node:fs/promises";
import { stat } from "node:fs/promises";
import * as url from "node:url";
import * as path from "node:path";

const server = http.createServer();
const port = 4000;
const notFound = `
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404</title>
  </head>
  <style>
    h1 {
      text-align: center;
    }
  </style>
  <body>
    <h1>404 <br> Not Valid Path</h1>
  </body>
</html>`;

server.on("request", (req, res) => {
  if (req.url === "/favicon.ico") {
    res.end();
  } else {
    handleRouts(req, res);
  }
});

function handleRouts(req, res) {
  let parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  if (pathname === "/") {
    renderHome(req, res);
  } else if (pathname.startsWith("/local")) {
    routLocal(req, res, pathname);
  } else if (pathname === "/client") {
    renderClient(req, res);
  } else if (pathname === "/client/upload") {
    routUpload(req, res);
  } else {
    res.end(notFound);
    console.log("404  Forbidden GET: " + req.url);
  }
}

async function routLocal(req, res, pathname) {
  let filePath = "." + decodeURIComponent(pathname.slice(6));
  if (pathname === "/local") {
    filePath += "/";
  }

  let stats = await checkStats(filePath);
  if (!stats) {
    res.end(notFound);
    console.log("404  Forbidden GET: " + req.url);
    return;
  }

  let isDir = stats.isDirectory();
  if (isDir) {
    try {
      let data = await fs.readdir(filePath);
      res.writeHead(200, { "content-type": "text/html" });
      let preDir = "";
      let mappedDir = filePath.slice(2).split("/").map((value, i) => {
        preDir += "/" + encodeURIComponent(value);
        return `<a class="nav" href="/local${preDir}">${value}</a>`;
      }).join(" / ");

      res.write(`
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Local Share</title>
        </head>
        <style>
          .home {
            text-align: center;
            background-color: rgb(175, 175, 175);
            color: white;
          }
          a {
            text-decoration: none;
          }
          body {
            background-color: rgb(195, 195, 195);
            margin: 0.5rem 1rem;
          }
          .nav {
            background-color: rgb(250, 223, 149);
            border-radius: 3px;
            padding: 0 1px;
            margin: 1px;
            border-bottom: 1px solid gray;
          }
          .files {
            background-color: rgb(246, 241, 241);
            border-radius: 3px;
            padding: .1rem .5rem;
            margin: .5rem;
            width: max-content;
          }
          h4 {
            background-color: rgb(164, 164, 164);
            padding: .2rem;
            border-radius: 3px;
          }
          .yellow {
            background-color: rgb(250, 247, 89);
          }
          .files>a {
            color: black;
          }
        </style>
        <body>
          <h1 class="home"><a href="/">LocalShare</a></h1>
          <h4>${'./<a class="nav" href="/local">local</a>' + ' / ' + mappedDir}</h4>
      `);

      for (let i = 0; i < data.length; i++) {
        let subPath = filePath + "/" + data[i];
        let subStats = await checkStats(subPath);
        let color = "white";
        if (subStats && subStats.isDirectory()) color = "yellow";
        res.write(`
          <h3 class="files ${color}">
            <a href="${pathname + '/' + data[i]}">${data[i]}</a>
          </h3>
        `);
      }
      res.end(`
        </body>
        </html>
      `);
      console.log("200  OK  GET: " + req.url);
    } catch (error) {
      res.end("No such file or Directory");
      console.log(error);
    }
  } else {
    try {
      let data = await fs.readFile(filePath);
      res.end(data);
      console.log("200  OK  GET: " + req.url);
    } catch (error) {
      res.end(notFound);
      console.log("404  Forbidden GET: " + req.url);
    }
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
      <h3><a href="/local">Get Local files (pc on which server running).</a></h3>
      <h3><a href="/client">Send Client files to Local.</a></h3>
      <p>Share files seamlessly between your devices on local network.</p>
    </body>
    </html>
  `);
}

function renderClient(req, res) {
  res.writeHead(200, { "content-type": "text/html" });
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
      <form action="/client/upload" method="post" enctype="multipart/form-data">
        <label for="filename">Please select a file you want to send to Local pc.<br /><br />
        <input id="filename" type="file" name="file" /></label>
        <br />
        <input type="submit" value="Upload" />
      </form>
    </body>
    </html>
  `);
}

function routUpload(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { "Allow": "POST" });
    res.end("Method Not Allowed");
    return;
  }

  const contentType = req.headers["content-type"];
  if (!contentType || !contentType.includes("multipart/form-data")) {
    res.writeHead(400);
    res.end("Bad Request: Expecting multipart/form-data");
    return;
  }

  const boundaryMatch = contentType.match(/boundary=(.*)/);
  if (!boundaryMatch) {
    res.writeHead(400);
    res.end("Bad Request: Missing boundary");
    return;
  }

  const boundary = boundaryMatch[1];
  const body = [];

  req.on("data", (chunk) => {
    body.push(chunk);
  });

  req.on("end", async () => {
    const fullBody = Buffer.concat(body);
    const boundaryBuffer = Buffer.from("--" + boundary + "\r\n");
    const closingBoundaryBuffer = Buffer.from("--" + boundary + "--\r\n");

    const firstBoundaryIndex = fullBody.indexOf(boundaryBuffer);
    if (firstBoundaryIndex !== 0) {
      res.writeHead(400);
      res.end("Bad Request: Invalid multipart data");
      return;
    }

    const partStarts = [firstBoundaryIndex];
    let start = firstBoundaryIndex + boundaryBuffer.length;
    while (true) {
      const nextBoundaryIndex = fullBody.indexOf(boundaryBuffer, start);
      if (nextBoundaryIndex === -1) break;
      partStarts.push(nextBoundaryIndex);
      start = nextBoundaryIndex + boundaryBuffer.length;
    }

    const closingIndex = fullBody.indexOf(closingBoundaryBuffer, start);
    if (closingIndex === -1) {
      res.writeHead(400);
      res.end("Bad Request: Missing closing boundary");
      return;
    }

    for (let i = 0; i < partStarts.length; i++) {
      const partStart = partStarts[i] + boundaryBuffer.length;
      const partEnd = i < partStarts.length - 1 ? partStarts[i + 1] : closingIndex;
      const part = fullBody.slice(partStart, partEnd);

      const headerEndIndex = part.indexOf(Buffer.from("\r\n\r\n"));
      if (headerEndIndex === -1) continue;

      const headersBuffer = part.slice(0, headerEndIndex);
      const contentBuffer = part.slice(headerEndIndex + 4, part.length - 2); // Exclude trailing \r\n

      const headersString = headersBuffer.toString("utf8");
      const headers = {};
      headersString.split("\r\n").forEach((line) => {
        const [key, value] = line.split(": ");
        if (key && value) headers[key.toLowerCase()] = value;
      });

      const contentDisposition = headers["content-disposition"];
      if (contentDisposition) {
        const match = contentDisposition.match(/form-data; name="([^"]+)"; filename="([^"]+)"/);
        if (match) {
          const name = match[1];
          const filename = match[2];
          if (name === "file" && filename) {
            const safeFilename = path.basename(filename); // Prevent directory traversal
            const uploadPath = path.join("uploads", safeFilename);
            try {
              await fs.mkdir("uploads", { recursive: true });
              await fs.writeFile(uploadPath, contentBuffer);
              console.log(`File uploaded: ${uploadPath}`);
            } catch (err) {
              console.error(`Error saving file: ${err}`);
            }
          }
        }
      }
    }

    res.writeHead(302, { "Location": "/client" });
    res.end();
  });
}

async function checkStats(filePath) {
  try {
    return await stat(filePath);
  } catch (error) {
    return null;
  }
}

import * as os from "node:os";

function getIPv4Addresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
        });
        console.log(`Open browser in your mobile and go to: "${iface.address}:${port}"`);
      }
    }
  }
  return addresses;
}

getIPv4Addresses();

server.listen(port);
console.log(`Server is listening at http://localhost:${port}`);