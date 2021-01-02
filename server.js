const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let mongoose = require("mongoose");
 
let bodyParser = require("body-parser");
let users ="mongodb+srv://menios:"+process.env.PW+"@cluster0.vyae4.mongodb.net/db_1?retryWrites=true&w=majority";
mongoose.connect(users, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useFindAndModify', false);// required for mongodb modifications

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
//--------------
let { Schema } = mongoose;

let newUserSchema = new Schema({
  username: String,
  log:[{
    description: String,
    duration: Number,
    date: String 
  }]
});

let Users = mongoose.model("Users", newUserSchema); //schema model

//create a user
app.post("/api/exercise/new-user", bodyParser.urlencoded({ extended: false }), (req, res)=>{
    Users.find({username:req.body.username}, (err, data)=>{
    if (err) return console.error(err);
    if(data=="")
      {
        let newUser = new Users({username:req.body.username});
        newUser.save((err, data)=>{
         if (err) return console.error(err);
         else res.json({username:data.username, _id:data._id});
        });  
      }
      else{res.json("Username "+req.body.username+" already exists")}
  });
});

//display all users
app.get("/api/exercise/users", (req, res)=>{
  Users.find({}, (err, data)=>{
    if (err) return console.error(err); 
    res.json(data);
  });
});

// modify a user(add new exercise) 
app.post("/api/exercise/add", bodyParser.urlencoded({ extended: false }), (req, res)=>{  
  
  if(!req.body.date) var newDate= Date().slice(0,15); 
  else  var newDate=new Date(req.body.date).toDateString().slice(0,15);
 
  let filter = {_id:req.body.userId};

  Users.findByIdAndUpdate(filter, { new: true }, (err,data)=>{
    if(data!=undefined)
    {  
      let update ={ description :req.body.description, duration: req.body.duration, date:newDate};
      data.log[data.log.length]=update;
      data.description= req.body.description;
      data.duration= parseInt(req.body.duration);
      data.date=newDate;
      data.save();
      res.json({_id:data._id, username:data.username, description:data.description, duration:data.duration, date:data.date});
    }
    else res.json("User with id:"+req.body.userId+" doesn't exists.");
  });
});

//get exercise log of any user
app.get("/api/exercise/log", (req, res)=>{
  Users.findOne({_id:req.query.userId}, (err,done)=>{
    let arr=[];
    if(done!= undefined) 
    {
      if(req.query.from && Date.parse(req.query.from))
        {
          done.log.forEach(element => {
            if(parseInt(Date.parse(element.date))>=parseInt(Date.parse(req.query.from)))
            {
              arr.push(element);
            }
          });
          done.log = arr;
        }
      if(req.query.to && Date.parse(req.query.to))
        {
          done.log.forEach(element => {
            if(parseInt(Date.parse(element.date))<=parseInt(Date.parse(req.query.from)))
            {
              arr.push(element);
            }
          });
          done.log = arr;
        }      
      if(req.query.limit) {
        done.log= done.log.slice(0, req.query.limit);
      }
      res.json({count:done.log.length, username:done.username, _id:done._id, log:done.log})
    }
    else res.json("User with id:"+req.query.userId+" doesn't exists. Invalid inputs");
  });
});
//--------------
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
