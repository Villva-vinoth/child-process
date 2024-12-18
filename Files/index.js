const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
    input:process.stdin,
    output:process.stdout
})

console.log(__dirname)

const filepath = path.join(__dirname, 'Logs.txt')
let content ='\n';

rl.question("hey there what happening ? ",(data)=>{
    content += data
    content += ` this is log with ${new Date().toISOString()}`
    fs.appendFile(filepath,content,(err)=>{
        if(err){
            console.log(err)
        }
        console.log("successfully !")
        fs.readFile(filepath,(err,data)=>{
            if(err){
                console.log(err);
            }
            console.log("data"+data)
        })
    })
})

