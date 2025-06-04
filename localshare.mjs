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
    <title>404 - Page Not Found</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f0f0f0;
        color: #333;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .content {
        text-align: center;
        padding: 20px;
        background-color: white;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      h1 {
        font-size: 48px;
        margin: 0 0 10px;
      }
      p {
        font-size: 18px;
        margin: 0 0 20px;
      }
      a {
        color: #007bff;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }
    </style>
  </head>
  <body>
    <div class="content">
      <h1>404</h1>
      <p>Page not found. <a href="/">Return to Home</a></p>
    </div>
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
        return `<a class="nav-link" href="/local${preDir}" title="${value}">${value}</a>`;
      }).join(" / ");

      res.write(`
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Local Files</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f0f0;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .header {
              background-color: #007bff;
              color: white;
              padding: 15px;
              text-align: center;
            }
            .header a {
              color: white;
              text-decoration: none;
              font-size: 24px;
            }
            .container {
              max-width: 1200px;
              margin: 20px auto;
              padding: 0 15px;
            }
            .breadcrumbs {
              background-color: #e9ecef;
              padding: 10px;
              border-radius: 5px;
              margin-bottom: 20px;
              overflow: auto;
              white-space: nowrap;
            }
            .nav-link {
              color: #007bff;
              text-decoration: none;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 150px;
              display: inline-block;
            }
            .nav-link:hover {
              text-decoration: underline;
            }
            .file-list {
              display: flex;
              flex-wrap: wrap;
              gap: 15px;
            }
            .file-item {
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: white;
              border: 1px solid #ddd;
              border-radius: 5px;
              padding: 15px;
              width: 200px;
              height: 50px;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              text-decoration: none;
              color: #333;
              margin: 5px;
              overflow: hidden;
            }
            .file-item.directory {
              background-color: #fff3cd;
            }
            .file-item.directory::before {
              content: "📁 ";
              margin-right: 5px;
            }
            .file-item:hover {
              color: #007bff;
            }
            .file-name {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 70%;
            }
            .file-ext {
              font-size: 0.8em;
              color: #666;
              margin-left: 5px;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <a href="/">LocalShare</a>
          </div>
          <div class="container">
            <div class="breadcrumbs">
              <a class="nav-link" href="/local" title="local">local</a> / ${mappedDir}
            </div>
            <div class="file-list">
      `);

      for (let i = 0; i < data.length; i++) {
        let subPath = filePath + "/" + data[i];
        let subStats = await checkStats(subPath);
        let isDir = subStats && subStats.isDirectory();
        let className = isDir ? "file-item directory" : "file-item";
        let displayName;

        if (isDir) {
          displayName = data[i];
        } else {
          let ext = path.extname(data[i]);
          if (ext) {
            let nameWithoutExt = path.basename(data[i], ext);
            displayName = `<span class="file-name">${nameWithoutExt}</span><span class="file-ext">${ext}</span>`;
          } else {
            displayName = data[i];
          }
        }

        res.write(`
          <a href="${pathname + '/' + data[i]}" class="${className}" title="${data[i]}">
            ${displayName}
          </a>
        `);
      }
      res.end(`
            </div>
          </div>
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
      <title>LocalShare</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 50px 15px;
          text-align: center;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 20px;
        }
        p {
          font-size: 16px;
          margin-bottom: 30px;
        }
        .btn {
          display: inline-block;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin: 5px;
        }
        .btn:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>LocalShare</h1>
        <p>Share files easily between devices on your local network.</p>
        <a href="/local" class="btn">Browse Local Files</a>
        <a href="/client" class="btn">Upload Files</a>
      </div>
    </body>
    </html>
  `);
}

function renderClient(req, res) {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(`
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>LocalShare - Upload</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .header {
          background-color: #007bff;
          color: white;
          padding: 15px;
          text-align: center;
        }
        .header a {
          color: white;
          text-decoration: none;
          font-size: 24px;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 0 15px;
        }
        .upload-box {
          background-color: white;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        label {
          display: block;
          margin-bottom: 10px;
          font-size: 16px;
        }
        input[type="file"] {
          margin-bottom: 20px;
        }
        input[type="submit"] {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
        }
        input[type="submit"]:hover {
          background-color: #0056b3;
        }
        input[type="submit"]:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        #progressContainer {
          margin-top: 20px;
          display: none;
        }
        #progressText {
          font-size: 14px;
          margin-bottom: 5px;
        }
        #progressBar {
          width: 100%;
          height: 20px;
          border: 1px solid #ddd;
          border-radius: 5px;
          background-color: #f0f0f0;
        }
        #progressBar::-webkit-progress-bar {
          background-color: #f0f0f0;
        }
        #progressBar::-webkit-progress-value {
          background-color: #007bff;
        }
        #progressInfo {
          font-size: 12px;
          color: #555;
          margin-top: 5px;
        }
        #message {
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <a href="/">LocalShare</a>
      </div>
      <div class="container">
        <div class="upload-box">
          <div id="message"></div>
          <form id="uploadForm" action="/client/upload" method="post" enctype="multipart/form-data">
            <label for="file">Upload a file to the local PC:</label>
            <input id="file" type="file" name="file" required />
            <input type="submit" value="Upload" />
          </form>
          <div id="progressContainer">
            <div id="progressText">Uploading: 0%</div>
            <progress id="progressBar" value="0" max="100"></progress>
            <div id="progressInfo"></div>
          </div>
        </div>
      </div>
      <script>
        document.getElementById("uploadForm").addEventListener("submit", (event) => {
          event.preventDefault();
          const form = event.target;
          const submitButton = form.querySelector('input[type="submit"]');
          submitButton.disabled = true;
          document.getElementById("progressContainer").style.display = "block";
          document.getElementById("message").innerHTML = "";

          const formData = new FormData(form);
          const xhr = new XMLHttpRequest();
          xhr.open("POST", form.action, true);

          // Track upload progress
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentage = (event.loaded / event.total * 100).toFixed(2);
              const timeElapsed = (Date.now() - startTime) / 1000; // in seconds
              const speed = (event.loaded / timeElapsed / 1024).toFixed(2); // KB/s
              const timeRemaining = ((event.total - event.loaded) / (event.loaded / timeElapsed)).toFixed(0); // seconds
              document.getElementById("progressText").textContent = \`Uploading: \${percentage}%\`;
              document.getElementById("progressBar").value = percentage;
              document.getElementById("progressInfo").textContent = 
                \`Speed: \${speed} KB/s, Time Remaining: \${timeRemaining} s\`;
            }
          });

          // Record start time and send the request
          const startTime = Date.now();
          xhr.send(formData);

          // Handle completion
          xhr.onload = () => {
            submitButton.disabled = false;
            document.getElementById("progressContainer").style.display = "none";
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.status === 'success') {
                  document.getElementById("message").innerHTML = '<p style="color: green;">File uploaded successfully.</p>';
                } else {
                  document.getElementById("message").innerHTML = '<p style="color: red;">Error uploading file.</p>';
                }
              } catch (e) {
                document.getElementById("message").innerHTML = '<p style="color: red;">Upload failed.</p>';
              }
            } else {
              document.getElementById("message").innerHTML = \`<p style="color: red;">Upload failed with status: \${xhr.status}</p>\`;
            }
          };

          // Handle errors
          xhr.onerror = () => {
            submitButton.disabled = false;
            document.getElementById("progressContainer").style.display = "none";
            document.getElementById("message").innerHTML = '<p style="color: red;">Upload error occurred.</p>';
          };
        });
      </script>
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

    let uploadStatus = 'error'; // Default to error

    for (let i = 0; i < partStarts.length; i++) {
      const partStart = partStarts[i] + boundaryBuffer.length;
      const partEnd = i < partStarts.length - 1 ? partStarts[i + 1] : closingIndex;
      const part = fullBody.slice(partStart, partEnd);

      const headerEndIndex = part.indexOf(Buffer.from("\r\n\r\n"));
      if (headerEndIndex === -1) continue;

      const headersBuffer = part.slice(0, headerEndIndex);
      const contentBuffer = part.slice(headerEndIndex + 4, part.length - 2);

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
          if (name === "file" && filename && filename.trim() !== "") {
            const safeFilename = path.basename(filename);
            const uploadPath = path.join("uploads", safeFilename);
            try {
              await fs.mkdir("uploads", { recursive: true });
              await fs.writeFile(uploadPath, contentBuffer);
              console.log(`File uploaded: ${uploadPath}`);
              uploadStatus = 'success';
            } catch (err) {
              console.error(`Error saving file: ${err}`);
              uploadStatus = 'error';
            }
          }
        }
      }
    }

    // Send JSON response instead of redirect
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: uploadStatus }));
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