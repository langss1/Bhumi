const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.sol')) results.push(file);
        }
    });
    return results;
}

function findArgs(str, startIdx) {
    let args = [];
    let currentArg = '';
    let depth = 0;
    let i = startIdx;
    while (i < str.length) {
        let char = str[i];
        if (char === '(') depth++;
        if (char === ')') {
            if (depth === 0) break;
            depth--;
        }
        if (char === ',' && depth === 0) {
            args.push(currentArg.trim());
            currentArg = '';
        } else {
            currentArg += char;
        }
        i++;
    }
    args.push(currentArg.trim());
    return { args, endIdx: i };
}

const files = walk('./node_modules/@openzeppelin');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    if (content.includes('pragma solidity ^0.8.24')) {
        content = content.replace(/pragma solidity \^0\.8\.24/g, 'pragma solidity ^0.8.20');
        changed = true;
    }

    let searchStr = 'mcopy(';
    let idx = content.indexOf(searchStr);
    while (idx !== -1) {
        let { args, endIdx } = findArgs(content, idx + searchStr.length);
        if (args.length === 3) {
            let [dest, src, len] = args;
            let replacement = `{ for { let i := 0 } lt(i, ${len}) { i := add(i, 32) } { mstore(add(${dest}, i), mload(add(${src}, i))) } }`;
            content = content.substring(0, idx) + replacement + content.substring(endIdx + 1);
            changed = true;
        }
        idx = content.indexOf(searchStr, idx + 1);
    }

    if (changed) {
        console.log('Saved ' + file);
        fs.writeFileSync(file, content);
    }
});
