const fs = require('fs');
const template = fs.readFileSync('./base.html', 'utf8')

let data = require('./http_codes.json').status_codes

let codes = Object.keys(data)

for (var i in codes) {
    let code = codes[i]
    let name = data[codes[i]].name
    let url = data[codes[i]].image

    let new_file = template.replace(/{CODE}/g, code).replace(/{NAME}/g, name).replace(/{LINK}/g, url)

    fs.writeFileSync(`./http/${code}.html`, new_file)
}