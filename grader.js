#!/usr/bin/env node
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');
var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';
var URL_DEFAULT = 'http://shrouded-everglades-1440.herokuapp.com';

var assertFileExists = function (inFile) {
    var instr = inFile.toString();
    if (!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }
    return instr;
};

var cheerioHtmlFile = function (htmlFile) {
    return cheerio.load(fs.readFileSync(htmlFile));
};

var loadChecks = function (checksFile) {
    return JSON.parse(fs.readFileSync(checksFile));
};

var processChecks = function (checks, $) {
    var out = {};
    for (var ii in checks) {
        if (checks.hasOwnProperty(ii)) {
            out[checks[ii]] = $(checks[ii]).length > 0;
        }
    }
    return out;
};

var checkHtmlFile = function (htmlFile, checksFile) {
    $ = cheerioHtmlFile(htmlFile);
    var checks = loadChecks(checksFile).sort();
    return processChecks(checks, $);
};

var checkUrl = function (url, checksFile) {
    restler.get(url).on('complete', function (result) {
        if (result instanceof Error) {
            console.error('Unable to fetch URL: ' + url);
        } else {
            $ = cheerio.load(result);
            var checks = loadChecks(checksFile).sort();
            var checkJson = processChecks(checks, $);
            var outJson = JSON.stringify(checkJson, null, 4);
            console.log(outJson);
        }
    });
};

var clone = function (fn) {
    return fn.bind({});
};

if (require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'Url to html file', null, URL_DEFAULT)
        .parse(process.argv);

    var checkJson = {};

    if (program.url) {
        checkUrl(program.url, program.checks);
    } else {
        checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }

} else {
    exports.checkHtmlFile = checkHtmlFile;
}

