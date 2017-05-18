const fs = require('fs');
const path = require('path');

function stack() {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    var err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
}

function callerFileDirname() {
    // 0 => callerFileDirname()
    // 1 => compileSQL()
    // 2 => the caller of compileSQL
    var s = stack()[2];
    var r;

    if (s && s.getFileName) {
        r = s.getFileName();
    } else {
        r = path.resolve('');
    }

    return path.dirname(r);
}

function inportString(filepath, file) {
    return `
-- INCLUDE: ${filepath}

${file}

-- INCLUDE END;
`;
}

const SQLRegExp = /\.sql$/i;
const SQLIncludeRegExp = /--\s*@include\s+([^\s\n]+)\n/ig;

function readFilesSQL(dirpath) {
    var files = fs.readdirSync(dirpath);

    return files.filter(file => SQLRegExp.test(file))
        .map(file => path.resolve(dirpath, file));
}

var cache = {};

function compileSQL(filepath, basedir) {
    basedir = basedir || callerFileDirname();
    const rootfilepath = path.resolve(basedir, filepath);
    const rootdirpath = path.dirname(rootfilepath);
    const rootbasedir = basedir || rootdirpath;

    if (cache[rootfilepath]) {
        return cache[rootfilepath];
    }

    function inportSQL(filepath) {
        return inportString(
            path.relative(rootbasedir, filepath),
            compileSQL(filepath, rootbasedir)
        );
    }

    function processFile(file) {
        return file.replace(
            SQLIncludeRegExp,
            function (match, $1, offset, string) {
                var filepath = path.resolve(rootdirpath, $1);
                var result = '';
                var files;

                if (SQLRegExp.test(filepath)) {
                    result = inportSQL(filepath);
                } else {
                    files = readFilesSQL(filepath);
                    for (var i = 0; i < files.length; i++) {
                        result += inportSQL(files[i]);
                    }
                }

                return result;
            }
        );
    }

    cache[rootfilepath] = processFile(fs.readFileSync(rootfilepath, 'utf8'));

    return cache[rootfilepath];
}

module.exports = compileSQL;
