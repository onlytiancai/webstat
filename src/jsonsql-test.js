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

function parse(data, ast) {
    if (ast.type == 'BinaryExpression') {
        var right = ast.right.value;
        if (ast.right.type == 'UnaryExpression') {
            right = -ast.right.argument.value;
        }
        switch(ast.operator) {
            case "==":
                return data[ast.left.name] == right;
            case "!=":
                return data[ast.left.name] != right;
            case ">":
                return data[ast.left.name] > right;
            case "<":
                return data[ast.left.name] < right;
            case "<=":
                return data[ast.left.name] <= right;
            case ">=":
                return data[ast.left.name] >= right;
            case "in":
                var arr = right.split(',');
                var name = data[ast.left.name].toString();
                return arr.filter(function(x){ return x.trim() == name}).length > 0;
            case "like":
                var name = data[ast.left.name].toString();
                return name.indexOf(right.toString()) > -1;
            default:
                throw new Error("unknow op: " + ast.operator);
        }
    } else if(ast.type == 'LogicalExpression') {
        switch(ast.operator) { 
            case "&&":
                var left = parse(data, ast.left);
                var right = parse(data, ast.right);
                return left && right;
            case "||":
                var left = parse(data, ast.left);
                var right = parse(data, ast.right);
                return left || right;
            default: 
                throw new Error("unknow op: " + ast.operator);
        }
    } else if(ast.type == 'UnaryExpression') {
        switch(ast.operator) { 
            case "!":
                var arg = parse(data, ast.argument);
                return !arg;
            case "-":
                return -ast.argument.value;
            default: 
                throw new Error("unknow op: " + ast.operator);
        }

    }else {
        throw new Error("unknow type: " + ast.type);
    }

}

function jsonWhere(ast) {
    return function(data) {
        try{ return parse(data, ast); }
        catch(e) { 
            console.error(e);
            return false; 
        }
    };
}


function log(cond){
    var ast = jsep(cond);
    console.log(cond);
    data.filter(jsonWhere(ast))
    .map(function(x){
        console.log("\t" + JSON.stringify(x).substring(0, 100)); 
    });
}

log("name == 'Alice'");
log("name != 'Alice'");
log("age > 30");
log("age >= 30");
log("age < 30");
log("age <= 30");
log("age in '25, 30'");
log("name like 'lice'");
log("age >= 30 && male == true");
log("age >= 30 || male == true");
log("age >= 30 || !(male == true)");
log("age >= 30 && email != 1 || age < 31");
log("age > -30");
