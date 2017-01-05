var express = require("express");
var validUrl = require("valid-url");
var mongo = require('mongodb').MongoClient;
var app = express();
var connectUrl = "mongodb://localhost:27017/urls";
var baseUrl = "https://lewisfroom-lewisfroom.c9users.io/";
app.get("/go/:ID", function(req,res){
    mongo.connect(connectUrl, function(err, db){
        if(err) throw err;
        var redirectCollection = db.collection("redirects");
        redirectCollection.find({_id: parseInt(req.params.ID)}).toArray(function(err, result){
           if(err) throw err;
           console.log("Link ID accessed: " + result[0]._id + " : " + result[0].originalurl);
           res.redirect(result[0].originalurl);
        });
    });
});

//returns the whole contents of the database into a html table - Add pages parameter to be used when the database is greater in size
app.get("/return", function(req,res){
    res.set('Content-Type', 'text/html');
    mongo.connect(connectUrl, function(err, db){
        if(err) throw err;
        var redirectCollection = db.collection("redirects");
        redirectCollection.find().toArray(function(err, result){
            if(err) throw err;
            var output = "<table border='1'><tr><td>Redirect URL</td><td>Original URL</td></tr>";
            result.forEach(function(item){
                output += "<tr><td> <a href='" + baseUrl + "go/" + item._id + "'>" + baseUrl + "go/" + item._id + "</a> </td><td> " + item.originalurl + " </tr>";
            });
            res.send(output + "</table>");
        });
    });
});


app.get("/add", function(req, res){
    res.set('Content-Type', 'application/json');
    if(typeof req.query.url == "undefined"){
        res.send(JSON.stringify({"error" : "URL undefined"}));
    } else {
        if (validUrl.isUri(req.query.url)){
            mongo.connect(connectUrl, function(err, db){
                if (err) throw err;

                var countersCollection = db.collection("counters");
                countersCollection.findAndModify({ _id: "linkid" },[], { $inc: { seq: 1 } }, {new: true}, function(err, doc){
                    if(err) throw err;
                    var newSeq = doc.value.seq;
                    var redirectCollection = db.collection("redirects");
                    redirectCollection.insert({"_id": newSeq,"originalurl" : req.query.url}, function(err, data){
                        if(err) throw err;
                        res.send(JSON.stringify({"originalurl": data.ops[0].originalurl, "shorturl": baseUrl + data.ops[0]._id.toString()}));
                    });
                });
            });
        } 
        else {
            res.send(JSON.stringify({"error": "Invalid URL"}));
        }
    }
});

app.listen(process.env.PORT, process.env.IP);