const express = require('express');
const  port= process.env.PORT || 4000
const multer = require('multer');
const app = express();
const fs = require('fs')
const { fork ,exec, execFile, spawn} = require('child_process');
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

app.get('/exec',(req,res)=>{

    exec('cd Files && ls -l',(err,stdout,stderr)=>{
        if(err){
            return res.send({
                message:`common Error ${err}`
            })
        }
        if(stderr){
            return res.send({
                message:`statement executing Error ${stderr}`
            })
        }
        console.log(`Output : ${stdout}`)
        res.send({
            commands:"cd Files && ls -l",
            out : stdout
        })
    })

})

app.get('/execFile',(req,res)=>{
    execFile('./commands.sh',(err,stdout,stderr)=>{
        if(err){
            return res.send({
                message:`common Error : ${err}`
            })
        }
        if(stderr){
            return res.send({
                message:`statement Executing Error : ${stderr}`
            })
        }
        console.log('out :',stdout);
        res.send({
            message:"file command",
            out:stdout
        })
    })
})

app.get('/spawn',(req,res)=>{

    // spawn  didn't know that the directory, sh for shell -c for executing command 

   const ls =  spawn('sh',['-c','pwd && cd Files && pwd && ls -l '])

   let output =''
   let error =''
   
   ls.stdout.on('data',(data)=>{
    console.log("out : "+data.toString());
    output +=data.toString()
   })
   ls.stderr.on('data',(data)=>{
    console.log("error :"+data.toString())
     error +=data
   })
   ls.on('exit',(code)=>{
    console.log("code :",code)
    if(code !==0){
        return res.send({
            message:error
        })
    }
    return res.send({
        message:output
    })
   })
})

app.listen(port,()=>{
    console.log("server is running on port "+port);
})