#! /usr/bin/env node

const express = require("express");
const vhost = require("vhost");
const https = require("https");
const fs = require("fs");
const dotenv = require("dotenv");

const app = express();
dotenv.config();

const subdomains = {};
const domains = process.env.DOMAINS.split(":");

var staticFolder = fs.readdirSync("./static");
var routersFolder = fs.readdirSync("./routers");

for (let folder of staticFolder) {
    subdomains[folder] = express.static(`./static/${folder}/`);
}

for (let folder of routersFolder) {
    subdomains[folder] = require(`./routers/${folder}`);
}

for (let domain of domains) {
    for (let subdomain in subdomains) {
        app.use(vhost(`${subdomain}.${domain}`, subdomains[subdomain]));
    }
    
    if ("www" in subdomains) {
        app.use(vhost(`${domain}`, subdomains.www));
    }
}

https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY),
    cert: fs.readFileSync(process.env.SSL_CERT)
}, app).listen(process.env.PORT || 443, () => console.log("Listening."));

if (process.env.REDIRECT_HTTP == "true") {
    const http = express();

    http.get("*", (req, res) => {
        res.redirect("https://" + req.headers.host + req.url);
    });

    http.listen(process.env.HTTP_PORT || 80);
}