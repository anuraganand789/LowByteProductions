const A = require('arcsecond');

const parser = A.str('hello').map(result => ({
    type : 'Captured String',
    value : result
}));

console.log(parser.run('hello people'))