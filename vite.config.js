const { build } = require("vite");
const path = require("path");
const chokidar = require("chokidar");
const glob = require("glob");
const chalk = require("chalk");
const { obfuscator } = require("rollup-obfuscator");
let obj;
let warningsArray = [];
const fs = require('fs');
const ws = require('ws');
const wss = new ws.Server({ port: 8080 });

const clients = [];
wss.on('connection', (ws) => {
    clients.push(ws);
    ws.on('close', () => {
        clients.splice(clients.indexOf(ws), 1);
    });
});

function compilingDone() {
    console.log('Compiling done');
    wss.clients.forEach((client) => {
        client.send('refresh');
    });
}

const JavaScriptObfuscator = require('javascript-obfuscator');

// Fonction pour construire un fichier donné
async function buildFile(file) {
    try {
        await build({
            configFile: false,
            logLevel: "info",
            css: {
                preprocessorOptions: {
                    scss: {}
                }
            },
            resolve: {
                alias: {
                    "@Styles": path.resolve(__dirname, "./theme/styles"),
                    "@Sections": path.resolve(__dirname, "./theme/styles/sections"),
                    "@Snippets": path.resolve(__dirname, "./theme/styles/snippets"),
                    "@Helpers": path.resolve(__dirname, "./theme/styles/helpers"),
                    "@Base": path.resolve(__dirname, "./theme/styles/base"),
                    "@Scripts": path.resolve(__dirname, "./src/scripts"),
                    "@FontsSolid": path.resolve(__dirname, "./theme/styles/assets/solid/scss"),
                    "@FontsOutline": path.resolve(__dirname, "./theme/styles/assets/outline/scss"),
                },
            },
            build: {
                terserOptions: {
                    toplevel: true,
                    mangle: true,
                    keep_classnames: true,
                    enclose: true
                },
                rollupOptions: {
                    input: file,
                    output: {
                        format: "es",
                        dir: path.resolve(__dirname, "dist"),
                        entryFileNames: `scripts/bundle.[name].js`,
                        assetFileNames: `styles/bundle.[name].[ext]`,
                    },
                    onwarn: (warning, warn) => {
                        if (warning.code === "EMPTY_BUNDLE") {
                            //find the file origin in the theme folder
                            let files = glob.sync(`${path.resolve(__dirname, "theme/scripts")}/**/*.js`);
                            let fileOriginPath;
                            files.forEach((file) => {
                                if (file.includes(warning.names[0])) {
                                    fileOriginPath = file;
                                }
                            });
                            obj = {
                                name: warning.names[0] + ".js",
                                inPath: path.resolve(__dirname, "dist/scripts/bundle." + warning.names[0] + ".js"),
                                fromPath: path.resolve(__dirname, fileOriginPath),
                            };
                            warningsArray.push(obj);
                        }
                    },
                },
                outDir: "dist",
                emptyOutDir: false,
                minify: "terser",
            }
        });
    } catch (error) {
        throw new Error(error);
    }
}

async function buildAllFiles(initial) {
    const scriptFiles = path.resolve(__dirname, "theme/scripts");
    const styleFiles = path.resolve(__dirname, "theme/styles");
    // Récupérer tous les fichiers .js dans le dossier theme/scripts et scss dans le dossier theme/styles
    const files = glob.sync(`${scriptFiles}/**/*.js`);
    let nbrOfFiles = files.length;
    console.log(chalk.hex('077E8C')(`Building ${nbrOfFiles} files`));
    let end;
    let start = new Date().getTime();
    await Promise.all(files.map(async (file) => await buildFile(file))).then((warn) => {
        end = new Date().getTime();
        let warnings = warningsArray;
        logWarning(warnings);
        warningsArray = [];
    });
    // //obfusctate js files
    // const jsFiles = glob.sync(`${path.resolve(__dirname, "dist/scripts")}/**/*.js`);
    // console.log(chalk.hex('077E8C')(`Obfuscating ${jsFiles.length} files`));
    // await Promise.all(jsFiles.map(async (file) => {
    //     if (file.includes('bundle')) {
    //         let data = fs.readFileSync(file, 'utf8');
    //         let obfuscationResult = JavaScriptObfuscator.obfuscate(data, {
    //             compact: true,
    //             controlFlowFlattening: false,
    //             deadCodeInjection: false,
    //             debugProtection: false,
    //             debugProtectionInterval: 0,
    //             disableConsoleOutput: false,
    //             identifierNamesGenerator: 'hexadecimal',
    //             log: false,
    //             numbersToExpressions: false,
    //             renameGlobals: false,
    //             selfDefending: false,
    //             simplify: true,
    //             splitStrings: false,
    //             stringArray: true,
    //             stringArrayCallsTransform: false,
    //             stringArrayCallsTransformThreshold: 0.5,
    //             stringArrayEncoding: [],
    //             stringArrayIndexShift: true,
    //             stringArrayRotate: true,
    //             stringArrayShuffle: true,
    //             stringArrayWrappersCount: 1,
    //             stringArrayWrappersChainedCalls: true,
    //             stringArrayWrappersParametersMaxCount: 2,
    //             stringArrayWrappersType: 'variable',
    //             stringArrayThreshold: 0.75,
    //             unicodeEscapeSequence: false
    //         });
    //         fs.writeFileSync(file, obfuscationResult.getObfuscatedCode(), 'utf8');
    //     }
    // }));
    let time = end - start;
    if (time < 1000) {
        console.log(chalk.hex('077E8C')(`Built ${nbrOfFiles} files in ${time}ms`));

    } else {
        let sec = time / 1000;
        let ms = time % 1000;
        console.log(chalk.hex('077E8C')(`Built ${nbrOfFiles} files in ${sec}s ${ms}ms`));
    }
    if (!initial) {
        console.log(chalk.green('Server running on:\n') + chalk.green.underline('http://localhost:3000\n'));
    }
}

// Initial build
if (process.argv.includes('--watch')) {
    chokidar
        .watch(["theme/styles/**/*.scss", "theme/scripts/**/*.js", "views/**/*.liquid", "sections/**/*.liquid", "snippets/**/*.liquid", "pages_sections/**/*.liquid"], console.log(chalk.green("Watching for changes...")))
        .on("change", async (file) => {
            if (file.endsWith(".liquid")) {
                console.log("liquid file changed");
                compilingDone();
                return;
            }
            if (file.endsWith(".scss")) {
                // find the matching js file
                console.log("scss file changed");
                //get the name of the file
                let fileName = path.basename(file, '.scss');
                //find the matching js file
                let jsFile = glob.sync(`${path.resolve(__dirname, "theme/scripts")}/**/${fileName}.js`);
                if(jsFile == undefined || jsFile.length == 0){
                    console.log("No matching js file found", "Skipping");
                    return;
                }
                try {
                    await buildFile(jsFile[0]);
                }
                catch (error) {
                    console.log(`No js file`);
                }
                compilingDone();
            }
            else if (file.endsWith(".js")) {
                await buildFile(file);
                compilingDone();
            }
            else {
                console.log("File type not supported");
                compilingDone();
            }
        });
} else {
    buildAllFiles(true);
}

//scripts for logs
function logWarning(warnings) {
    if (warnings.length > 0) {
        console.log(chalk.yellow(`Warnings:`));
        warnings.forEach((warning) => {
            let part1 = chalk.bold.yellow(`${warning.name} generated an empty bundle : \n`);
            let part2 = chalk.bold.blue('IN :') + chalk.underline.magenta(`${warning.inPath}\n`);
            let part3 = chalk.bold.blue('FROM :') + chalk.underline.magenta(`${warning.fromPath}\n`);
            console.log(part1, part2, part3);
        });
    }
}