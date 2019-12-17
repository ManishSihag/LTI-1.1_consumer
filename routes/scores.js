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
    client.keys('*', function(err, log_list) {


        var keys = Object.keys(log_list);
        var i = 0;

        keys.forEach(function(l) {
            client.get(log_list[l], function(e, o) {
                i++;
                if (e) {
                    console.log(e)
                } else {
                    temp_data = {
                        'key': log_list[l],
                        'value': o
                    };
                    return_dataset.push(temp_data);
                }

                if (i == keys.length) {


                    res.render('scores', {
                        results: return_dataset
                    });
                }

            });
        });

    });



})




module.exports = router;