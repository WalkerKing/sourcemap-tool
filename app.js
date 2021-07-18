const sourceMap = require('source-map');
const http = require('http');
const fs = require('fs');
const Koa = require('koa');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');

const app = new Koa();

// 工具方法

function downloadFile(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data);
            });
        });
    });
}

// logger

app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time

app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

// response

router.get('/', async (ctx, next) => {
    const indexHtml = fs.readFileSync('./views/index.html');
    ctx.response.type = 'text/html';
    ctx.response.body = indexHtml;
});
router.post('/getOriginPosition', async (ctx, next) => {
    const errorString = ctx.request.body.errorString;
    let errorFile = ctx.request.body.errorFile || '';
    let line = Number(ctx.request.body.line) || '';
    let column = Number(ctx.request.body.column) || '';
    if (errorString) {
        [errorFile, line, column] = errorString.split(':');
    }
    console.log('ctx.request.body', ctx.request.body);
    if (errorFile && line && column) {
        if (errorFile.endsWith('.js')) {
            errorFile += '.map';
        }
        let rawSourceMapJsonData = null;
        try {
            const fileAccess = fs.accessSync(errorFile);
            rawSourceMapJsonData = fs.readFileSync(errorFile, 'utf8');
        } catch(err) {
            // console.log('err', err);
            rawSourceMapJsonData = await downloadFile(
                'http://localhost:1111/test/build.js.map'
            );
        }
        const consumer = await new sourceMap.SourceMapConsumer(rawSourceMapJsonData)
        let pos = consumer.originalPositionFor({
            line: line - 0,
            column: column - 0,
        });
        console.log('pos', pos)
        ctx.response.body = pos;
    } else {
        ctx.response.body = `参数无效`;
    }
});

app.use(bodyParser());

app.use(router.routes());

app.listen(3000);

console.log('You can visit http://localhost:3000');
