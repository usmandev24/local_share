# LocalShare

LocalShare is a lightweight Node.js server for sharing files over a local network. It uses only built-in Node.js modules (`http`, `fs`, `url`, `path`, `os`) to keep things simple and dependency-free. The server runs on port `4000` and works on Windows, macOS, and Linux.

# About this project:

This project I made by chance . Acctually I was just learing node.js and decided to do some practicall and this type of fileserver I read on Eloquent JavaScript book so I decided to expand this and increase its fuctionality.
But the problem that I faced was when upload files to server through client this was new for me and the book "Node.js web development server side using practical examples" I was just reached to chapter 5 and may be on next chapters book will guide on this but as a curiosity I decided to take help from ai which actually worked and I learned a lot. 

## Features Implemented by Me

- **HTTP Server Setup**: Built a server with `http.createServer()` to handle requests on port `4000`.
- **File Browsing (`/local`)**: Created a route to list files and directories in the server’s root directory, styled with HTML/CSS. Users can navigate subdirectories or download files.
- **Upload Page (`/client`)**: Designed an HTML form for file uploads with basic CSS styling.
- **Routing Logic**: Set up routes for home (`/`), file browsing (`/local/*`), upload page (`/client`), and a 404 page for invalid URLs.
- **Network Discovery**: Added `os.networkInterfaces()` to log all IPv4 addresses, allowing access from other devices on the network (e.g., `192.168.1.x:4000`).
- **Path Handling**: Used `path` and `url` modules to handle file paths and URLs safely across platforms.
- **Responsive Design**: Applied  CSS for a clean look with consistent colors.
- **per_localshare:** This orignal code which is written by me is pre_localshare.mjs. You can check it also. 

## Features Enhanced by Using Grok

- **File Upload Handling**: Added `/client/upload` route to process `multipart/form-data` uploads. Files are saved to an `uploads/` directory using `fs.writeFile`. Sanitized filenames with `path.basename` for security.
- **Improved UI**: Updated `/`, `/local`, and `/client` pages with cleaner, responsive HTML/CSS. Kept your color scheme (`#007bff`, `#f0f0f0`) and used flexbox for file lists and box shadows for visual depth.
- **Fixed typo**: Corrected console log typo (`"listing"` to `"listening"`), fixed file link generation in `/local`, and improved `checkStats` to return `null` for 404 cases.
- **Upload Feedback**: Added query parameters (`?upload=success` or `?upload=error`) to `/client` redirect after uploads. Displays green success or red error message above the form.

## Prerequisites

- **Node.js**: Version 14+ (uses ES modules with `import`).
- **OS**: Works on Windows, macOS, Linux.

## Setup

1. Clone Repo... or just download the **localshare** file
2. Open a terminal in the directory and run:
   ```bash
   node localserver.mjs 
   ```
   or
   ```bash
   node pre_localserver.mjs
   ```
3. Server starts at `http://localhost:4000`. Check console for network IPs (e.g., `192.168.1.x:4000`).

## Usage

- **Home (`/`)**: Links to browse files or upload.
- **Browse Files (`/local`)**: Shows files/directories as clickable boxes. Click to navigate or download.
- **Upload Files (`/client`)**: Select a file, click "Upload". Files save to `uploads/`. See success/error message after.
- **404 Page**: Shows for invalid URLs with a link back to home.

## Notes

- **Security**: Filenames are sanitized to prevent directory traversal. Could add `path.resolve` for stricter path checks.
- **Limitations**: Uploads buffer files in memory, fine for small files. Streaming would be better for large files but needs more code.
- **Permissions**: Ensure write access for the `uploads/` directory.

## License

Copywrite 2025 Usman Ghani (usmandev24) MIT License. Free to modify but include this Licence and readme.

## Acknowledgments

Built with Node.js built-in modules. Enhanced by Grok (xAI) .
