var express = require('express');
var router = express.Router();
var oauth = require('oauth-sign')
var timestamp = Math.round(Date.now() / 1000);
const nonce = require('nonce')();


router.get('/', function(req, res, next) {
  let ltiParams = {
    lti_message_type : req.query.lti_message_type,
    lti_version : req.query.lti_version,
    resource_link_id : req.query.resource_link_id,
    roles : req.query.roles,

    //lis
    lis_result_sourcedid: req.query.lis_result_sourcedid,
    lis_outcome_service_url: req.query.lis_outcome_service_url, 

    oauth_consumer_key: req.query.oauth_consumer_key,
    oauth_signature_method: req.query.oauth_signature_method,
    oauth_timestamp: timestamp, 
    oauth_nonce: nonce(),
    oauth_version: req.query.oauth_version
  }

  var ltiObj = {
    tool_secret : req.query.tool_secret,
    tool_provider_url : req.query.tool_provider_url
  }
 
  delete req.query.tool_secret;
  delete req.query.tool_provider_url;

  ltiParams.oauth_signature = oauth.hmacsign('POST',ltiObj.tool_provider_url,ltiParams,ltiObj.tool_secret);
 
  res.render('launch', { 
  ltiParams : ltiParams,
  action : ltiObj.tool_provider_url})

});

module.exports = router;
