const express = require('express');
const  port= process.env.PORT || 4000
const multer = require('multer');
const app = express();
const fs = require('fs')
const { fork } = require('child_process');
const f = new Map();
const count = 5;
const time = 60*1000
const errormessage = {
    message:"limit reached try again after 1 minute"
}
const statusCode = 200 
const Limiter = (req,res,next)=>{
        if(f.has(req.ip)){
            if(f.get(req.ip).count<=0){
                res.writeHead(statusCode || 429)
                res.write(JSON.stringify(errormessage));
                res.end();
            }
            else{
                f.get(req.ip).count-=1;
                next()
            }
        }
        else{
             f.set(req.ip, { count:count-1, timeout: setTimeout(() => f.delete(req.ip),time) });
            next()
        }
}

if(!fs.existsSync('./uploads')){
    console.log("true",)
    fs.mkdirSync('./uploads')
}
const storage = multer.diskStorage({
    filename:(req,file,cb)=>{
        cb(null,`${new Date().toJSON()+'-'+file.originalname}`)
    },
    destination:(req,file,cb)=>{
        cb(null,'./uploads')
    }
})

const upload = multer({storage})

app.post('/uploads',upload.single('img'), async (req,res)=>{
    const file = req.file;
    const filepathforsharp = './uploads/process-'+file.filename 
    const child = fork('./child.js')
    child.send({path:file.path,opath:filepathforsharp})

    child.on('message',(data)=>{
        res.send({
            message:"upload Successfully !",
            filename:data,
            process:child.pid
        })
    })
    child.on('exit',(code)=>{
        if(code !==0){
            res.send({
                message:"Error intrupted!"
            })
            if(fs.existsSync(file.path)){
                fs.unlinkSync(file.path)
            }
        }
        
    })
   

   
    
})

app.get('/',Limiter,(req,res)=>{
    res.write("hello")
    res.end();
})

app.listen(port,()=>{
    console.log("server is running on port "+port);
})