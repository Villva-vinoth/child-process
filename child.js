const sharp = require('sharp')
const fs = require('fs')

process.on('message',async (message)=>{
    // console.log('me',message)
    const pr =await imageProcessed(message.path,message.opath)
    process.send(pr)
    process.exit(0);
})

const imageProcessed = async (path,opath)=>{
    await sharp(path)
    .resize(500,500,{fit:'contain'})
    .sharpen({
        sigma: 2,
        m1: 0,
        m2: 3,
        x1: 3,
        y2: 15,
        y3: 15,
      })    
      .toFile(opath)
    .then(data=>{
        if(fs.existsSync(path)){
            fs.unlinkSync(path) 
        }
    })
    .catch(err=>{
        console.log(err,"r")
    })

    return opath;
}
