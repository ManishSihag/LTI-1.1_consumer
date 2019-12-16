var express = require('express');
var router = express.Router();
var oauth = require('oauth-sign')
var uuid = require('node-uuid');
var url = require('url');
var HMAC_SHA1 = require('../node_modules/ims-lti/lib/hmac-sha1');
var xml_builder = require('xmlbuilder');



router.post('/',(req, res)=>{

//var signer =  new HMAC_SHA1();
var lis_outcome_service_url = "https://consumer-lti.herokuapp.com/result";
var tool_secret = "secret";


var authHeaders = stringToArray(req.headers.authorization);
var a = decodeURIComponent(authHeaders[5]);

var oauthsignature = authHeaders[7];


var reqHeaders = {
    oauth_body_hash :  a,
    oauth_consumer_key: authHeaders[4],
    oauth_signature_method: authHeaders[6],
    oauth_timestamp: authHeaders[3], 
    oauth_nonce: authHeaders[2],
    oauth_version: authHeaders[1]
}

//var service_url_parts = url.parse(lis_outcome_service_url, true);

//var oauth_signature = signer.build_signature_raw(lis_outcome_service_url, service_url_parts, 'POST', reqHeaders, tool_secret);
var oauth_signature = oauth.hmacsign('POST',lis_outcome_service_url,reqHeaders,tool_secret);
var encodedSignature = specialEncode(oauth_signature);




if(encodedSignature == oauthsignature ){
    console.log("Authorized:", true);
    var result;
  if(req.body.imsx_poxenveloperequest.imsx_poxbody[0].hasOwnProperty('replaceresultrequest')){
    result = getResult(req.body);
    xml = outcomeResponse('replaceResult',result.status, result.discription);
    return res.status(200).send(xml);
  }
  else if(req.body.imsx_poxenveloperequest.imsx_poxbody[0].hasOwnProperty('deleteresultrequest')){
    result = getResult(req.body);
    xml = outcomeResponse('deleteResult',result.status, result.discription);
    return res.status(200).send(xml);
  }  
else if(req.body.imsx_poxenveloperequest.imsx_poxbody[0].hasOwnProperty('readrequest')) {
    result = getResult(req.body);
    xml = outcomeResponse('readResult',result.status, result.discription);
    return res.status(200).send(xml);
}
  else{
    xml = outcomeResponse('readResult','failed','requestFailed');
      return res(200).send(xml)
  } 

   

}
else{
  res.status(403).send()
}

})

function getResult(body){
    var result = {};
    var score = 100 * (body.imsx_poxenveloperequest.imsx_poxbody[0].replaceresultrequest[0].resultrecord[0].result[0].resultscore[0].textstring[0])
    if(score >= 0 && score<=100){
        result.score = score;
        result.status = 'success';
        result.discription = `The score is ${this.score} and submitted to the consumer`;
    }
    else{
        result.score = score;
        result.status = 'failed';
        result.discription = `${score} is not valid`;
    }
    return result;
}

function outcomeResponse(operation, status, discription){

    var xmldec = {
     version : '1.0',
     encoding : 'UTF-8'}
doc = xml_builder.create('imsx_POXEnvelopeResponse', xmldec)
doc.attribute('xmlns', 'http://www.imsglobal.org/services/ltiv1p1/xsd/imsoms_v1p0');
head = doc.ele('imsx_POXHeader').ele('imsx_POXResponseHeaderInfo');
body = doc.ele('imsx_POXBody').ele(operation + 'Response');
head.ele('imsx_version', 'V1.0');
head.ele('imsx_messageIdentifier', uuid.v1());
innrerHead = head.ele('imsx_statusInfo');
innrerHead.ele('imsx_codeMajor',status);
innrerHead.ele('imsx_severity','status');
innrerHead.ele('imsx_description',discription);
innrerHead.ele('imsx_messageRefIdentifier',uuid.v1());
innrerHead.ele('imsx_operationRefIdentifier',operation);


xml = doc.end({ pretty: true});
return xml;
}

function specialEncode(string) {
    return encodeURIComponent(string).replace(/[!'()]/g, escape).replace(/\*/g, '%2A');
  };

function stringToArray(str){
     
    var strArr = str.split(',');
    
    var valueArr = [];
    
    strArr.forEach((str) => {
      var lastindex = str.lastIndexOf('=')
      var value = str.substring(lastindex+1);
      valueArr.push(value.replace(/^"(.*)"$/, '$1'));
      lastindex=0;
    })
    

    return valueArr;
}

module.exports = router;