var express = require('express');
var router = express.Router();
var redis = require('redis');

if (process.env.REDISCLOUD_URL) {
    var client = redis.createClient(process.env.REDISCLOUD_URL, {
        no_ready_check: true
    });
} else {
    var client = redis.createClient('6379', 'localhost', {
        no_ready_check: true
    });
}

router.get('/', (req, res) => {

    var return_dataset = [];
    client.keys('*', function(err, id_list) {
    
      var keys = Object.keys(id_list);
        
      keys.forEach(function(l) {
            client.get(id_list[l], function(err, reply) {
                if (err) {
                    console.log(err)
                } else {
                    temp_data = {
                        'key': id_list[l],
                        'value': reply
                    };
                    return_dataset.push(temp_data);
                }
                
                res.render('scores', {
                        results: return_dataset
                    });
                
              });
        });

    });
})




module.exports = router;