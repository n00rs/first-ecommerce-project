const mongoClient = require('mongodb').MongoClient
state = {
    db:null
}

module.exports.connect=function(done){
    let url = "mongodb://localhost:27017";
    let dbName = "reshopping"
    mongoClient.connect(url,(err,data) => {
        if(err) return done(err);
        state.db=data.db(dbName);
        done();
    })
}

module.exports.get=function(){
    return state.db;
}