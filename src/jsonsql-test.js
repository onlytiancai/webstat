var jsep = require('jsep');
jsep.addBinaryOp("in", 10);
jsep.addBinaryOp("like", 10);

var data = [
    {name:"Alice",age:25, email: "alice@searchjs.com",city:{"Montreal":"first","Toronto":"second"}, other: { personal: { birthPlace: "Vancouver" } } },
    {name:"Brian",age:30, email: "brian@searchjs.com",male:true,empty:"hello"},
    {name:"Carrie",age:30, email: "carrie@searchjs.com",city:{"Montreal":true,"New York":false}},
    {name:"David",age:35, email: "david@searchjs.com",male:true},
    {name:"Alice",age:30, email: ["alice@searchjs.com","alice@gmail.com"], cars: [{brand: 'BMW', cds: [{title:'Best Of 2015'}, {title:'Best Of 2016'}]}, {brand: 'Porsche'}]}
];

function jsonWhere(cond) {
    return function(data) {
        with(data) {
            try { return eval(cond); }
            catch(e) { return false; }
        }
    };
}
/*
 *
 * { type: 'BinaryExpression',
 *   operator: '==',
 *     left: { type: 'Identifier', name: 'name' },
 *       right: { type: 'Literal', value: 'Alice', raw: '\'Alice\'' } }
 *
 * */
function jsonWhere2(ast) {
    return function(data) {
        if (ast.type == 'BinaryExpression') {
            switch(ast.operator) {
                case "==":
                    return data[ast.left.name] == ast.right.value;
                case "!=":
                    return data[ast.left.name] != ast.right.value;
                case ">":
                    return data[ast.left.name] > ast.right.value;
                case "<":
                    return data[ast.left.name] < ast.right.value;
                case "<=":
                    return data[ast.left.name] <= ast.right.value;
                case ">=":
                    return data[ast.left.name] >= ast.right.value;
                case "in":
                    var arr = ast.right.value.split(',');
                    var name = data[ast.left.name].toString();
                    return arr.filter(function(x){ return x.trim() == name}).length > 0;
                case "like":
                    var name = data[ast.left.name].toString();
                    return name.indexOf(ast.right.value.toString()) > -1;
                default:
                    throw new Error("unknow op: " + ast.operator);
            }
        }
    };
}


function log(cond){
    console.log(cond, data.filter(jsonWhere(cond)));
    var ast = jsep(cond);
    console.log(ast);
    console.log(cond, data.filter(jsonWhere2(ast)));
}
/*
log("name == 'Alice'");
log("name != 'Alice'");
log("age > 30");
log("age >= 30");
log("age < 30");
log("age <= 30");
log("age in '25, 30'");
log("name like 'lice'");
*/
log("age >= 30 && male == true");
//log("(age >= 30 && (email.indexOf('carrie') != -1) || age < 31)");
