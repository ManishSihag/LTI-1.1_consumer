var express = require('express');
var router = express.Router();
var oauth = require('oauth-sign')
var uuid = require('node-uuid');
var xml_builder = require('xmlbuilder');
var redis = require('redis');
var config = require('../config/config')

if(process.env.REDISCLOUD_URL){
  var client = redis.createClient(process.env.REDISCLOUD_URL, {no_ready_check: true}); 
}
else{
  var client = redis.createClient('6379', 'localhost', {no_ready_check: true});
}

router.post('/', (req, res) => {

    var lis_outcome_service_url = config.connection.lis_outcome_service_url;
    var tool_secret = config.connection.tool_secret;

    var authHeaders = stringToArray(req.headers.authorization);
    var decoded_body_hash = decodeURIComponent(authHeaders[5]);

    var oauth_signature = authHeaders[7];

    var reqHeaders = {
        oauth_body_hash: decoded_body_hash,
        oauth_consumer_key: authHeaders[4],
        oauth_signature_method: authHeaders[6],
        oauth_timestamp: authHeaders[3],
        oauth_nonce: authHeaders[2],
        oauth_version: authHeaders[1]
    }
    
    var consumer_signature = oauth.hmacsign('POST', lis_outcome_service_url, reqHeaders, tool_secret);
    var encodedSignature = specialEncode(consumer_signature);

    if (encodedSignature == oauth_signature) {
        console.log("Authorized:", true);
        var result;
        if (req.body.imsx_poxenveloperequest.imsx_poxbody[0].hasOwnProperty('replaceresultrequest')) {
            result = getResult(req.body);
            xml = outcomeResponse('replaceResult', result.status, result.discription);

            client.set([result.sourcedid, result.score], function(err, reply) {
              if(!err)  
               {console.log('Data sent to db', reply);
                res.status(200).send(xml);}
                else{
                  res.status(500);
                }
              });
            
        } else if (req.body.imsx_poxenveloperequest.imsx_poxbody[0].hasOwnProperty('deleteresultrequest')) {
            result = getResult(req.body);
            xml = outcomeResponse('deleteResult', result.status, result.discription);
            client.del(result.sourcedid, function(err, reply) {
              if(!err)  
                 {console.log('DB updated', reply);
                  res.status(200).send(xml);}
                  else{
                    res.status(500);
                  }
                });
            
        } else if (req.body.imsx_poxenveloperequest.imsx_poxbody[0].hasOwnProperty('readrequest')) {
            result = getResult(req.body);
            xml = outcomeResponse('readResult', result.status, result.discription);
            
            client.get(result.sourcedid, function(err, reply) {
              if(!err)  
               {console.log('Read frm DB', reply);
                res.status(200).send(xml);}
                else{
                  res.status(500);
                }
              });
        } else {
            xml = outcomeResponse('unknownRequest', 'failed', 'requestFailed');
            return res(200).send(xml)
        }



    } else {
        res.status(403).send()
    }

})

function getResult(body) {
    var result = {};
    result.sourcedid = body.imsx_poxenveloperequest.imsx_poxbody[0].replaceresultrequest[0].resultrecord[0].sourcedguid[0].sourcedid[0];
    var score = 100 * (body.imsx_poxenveloperequest.imsx_poxbody[0].replaceresultrequest[0].resultrecord[0].result[0].resultscore[0].textstring[0])
    if (score >= 0 && score <= 100) {
        result.score = score;
        result.status = 'success';
        result.discription = `The score is ${this.score} and submitted to the consumer`;
    } else {
        result.score = score;
        result.status = 'failed';
        result.discription = `${score} is not valid`;
    }
    return result;
}

function outcomeResponse(operation, status, discription) {

    var xmldec = {
        version: '1.0',
        encoding: 'UTF-8'
    }
    doc = xml_builder.create('imsx_POXEnvelopeResponse', xmldec)
    doc.attribute('xmlns', 'http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0');
    head = doc.ele('imsx_POXHeader').ele('imsx_POXResponseHeaderInfo');
    body = doc.ele('imsx_POXBody').ele(operation + 'Response');
    head.ele('imsx_version', 'V1.0');
    head.ele('imsx_messageIdentifier', uuid.v1());
    innrerHead = head.ele('imsx_statusInfo');
    innrerHead.ele('imsx_codeMajor', status);
    innrerHead.ele('imsx_severity', 'status');
    innrerHead.ele('imsx_description', discription);
    innrerHead.ele('imsx_messageRefIdentifier', uuid.v1());
    innrerHead.ele('imsx_operationRefIdentifier', operation);

    xml = doc.end({
        pretty: true
    });
    return xml;
}

function specialEncode(string) {
    return encodeURIComponent(string).replace(/[!'()]/g, escape).replace(/\*/g, '%2A');
};

function stringToArray(str) {

    var strArr = str.split(',');
    var valueArr = [];

    strArr.forEach((str) => {
        var lastindex = str.lastIndexOf('=')
        var value = str.substring(lastindex + 1);
        valueArr.push(value.replace(/^"(.*)"$/, '$1'));
        lastindex = 0;
    })
    return valueArr;
}

module.exports = router;