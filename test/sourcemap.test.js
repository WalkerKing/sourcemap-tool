const sourceMap = require('source-map');
let rawSourceMapJsonData = fs.readFileSync('./dist/build.js.map', 'utf8');
new sourceMap.SourceMapConsumer(rawSourceMapJsonData).then((consumer) => {
    let pos = consumer.originalPositionFor({
        line: 2,
        column: 70974,
    });
    console.log(pos) 
});
