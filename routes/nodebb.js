const proxyUtils = require('../proxy/proxyUtils.js')
const proxy = require('express-http-proxy');
const { NODEBB_SERVICE_URL, nodebb_api_slug, Authorization, lms_user_read_path, sunbird_learner_service_host, 
  CASSANDRA_IP, CASSANDRA_KEYSPACE,CASSANDRA_IP_PORT } = require('../helpers/environmentVariablesHelper.js');
const { logger } = require('@project-sunbird/logger');
const BASE_REPORT_URL = "/discussion";
const express = require('express');
const app = express();
const sbLogger = require('sb_logger_util');
const request = require('request');
const Telemetry = require('../libs/sb_telemetry_util/telemetryService.js')
const telemetry = new Telemetry()
const methodSlug = '/update';
const nodebbServiceUrl = NODEBB_SERVICE_URL+ nodebb_api_slug;
const _ = require('lodash')
const axios = require('axios');
const authorization = Authorization;
const learnerServiceHost = sunbird_learner_service_host;
const userReadPath = lms_user_read_path;
const cassandraDriver = require('cassandra-driver');
const { lookup } = require('dns');

let logObj = {
  "eid": "LOG",
  "ets": 1518460198146,
  "ver": "3.0",
  "mid": "LOG:69e9ca45-c7e2-4a94-af50-50a4ff854cc9",
  "actor": {
    "id": "discussion-forum-middleware",
    "type": "API"
  },
  "context": {},
  "edata": {}
};
const responseObj = {
  errorCode: 400,
  message: 'You are not authorized to perform this action.'
};

app.post(`${BASE_REPORT_URL}/forum/v2/read`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/v2/create`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/v2/remove`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/v3/create`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/tags`, proxyObject())
app.post(`${BASE_REPORT_URL}/privileges/v2/copy`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/v3/user/profile`, proxyObject());


app.post(`${BASE_REPORT_URL}/forum/v3/group/membership`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/v3/groups/users`, proxyObject());
app.post(`${BASE_REPORT_URL}/forum/v3/category/:cid/privileges`, proxyObject());

app.get(`${BASE_REPORT_URL}/tags`, proxyObject());
app.post(`${BASE_REPORT_URL}/tags/list`, proxyObject());
app.get(`${BASE_REPORT_URL}/tags/:tag`, proxyObject());
app.get(`${BASE_REPORT_URL}/categories`, proxyObject());
app.post(`${BASE_REPORT_URL}/category/list`, proxyObject());
app.get(`${BASE_REPORT_URL}/notifications`, proxyObject());

// categories apis
app.get(`${BASE_REPORT_URL}/category/:category_id/:slug`, proxyObject());
app.get(`${BASE_REPORT_URL}/categories`, proxyObject());
app.get(`${BASE_REPORT_URL}/category/:cid`, proxyObject());
app.get(`${BASE_REPORT_URL}/categories/:cid/moderators`, proxyObject());

// topic apis
app.get(`${BASE_REPORT_URL}/unread`, proxyObject());
app.get(`${BASE_REPORT_URL}/recent`, proxyObject());
app.get(`${BASE_REPORT_URL}/popular`, proxyObject());
app.get(`${BASE_REPORT_URL}/top`, proxyObject());
app.get(`${BASE_REPORT_URL}/topic/:topic_id/:slug`, proxyObject());
app.get(`${BASE_REPORT_URL}/topic/:topic_id`, proxyObject());
app.get(`${BASE_REPORT_URL}/unread/total`, proxyObject());
app.get(`${BASE_REPORT_URL}/topic/teaser/:topic_id`, proxyObject());
app.get(`${BASE_REPORT_URL}/topic/pagination/:topic_id`, proxyObject());

// groups api
app.get(`${BASE_REPORT_URL}/groups`, proxyObject());
app.get(`${BASE_REPORT_URL}/groups/:slug`, proxyObject());
app.get(`${BASE_REPORT_URL}/groups/:slug/members`, proxyObject());

// post apis
app.get(`${BASE_REPORT_URL}/recent/posts/:day`, proxyObject());

// topics apis
app.post(`${BASE_REPORT_URL}/v2/topics`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/topics/:tid`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/topics/update/:tid`, proxyObjectForPutApi());
app.delete(`${BASE_REPORT_URL}/v2/topics/:tid`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/topics/:tid/state`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/topics/:tid/follow`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/topics/:tid/follow`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/topics/:tid/tags`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/topics/:tid/tags`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/topics/:tid/pin`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/topics/:tid/pin`, proxyObject());

// categories apis
app.post(`${BASE_REPORT_URL}/v2/categories`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/categories/:cid`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/categories/:cid`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/categories/:cid/state`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/categories/:cid/state`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/categories/:cid/privileges`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/categories/:cid/privileges`, proxyObject());

// groups apis 
app.post(`${BASE_REPORT_URL}/v2/groups`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/groups/:slug`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/groups/:slug/membership`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/groups/:slug/membership/:uid`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/groups/:slug/membership`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/groups/:slug/membership/:uid`, proxyObject());


// post apis 
app.get(`${BASE_REPORT_URL}/post/pid/:pid`, proxyObjectWithoutAuth());
app.post(`${BASE_REPORT_URL}/v2/posts/:pid`, isEditablePost(), proxyObjectForPutApi());
app.delete(`${BASE_REPORT_URL}/v2/posts/:pid`,isEditablePost() , proxyObject());
app.put(`${BASE_REPORT_URL}/v2/posts/:pid/state`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/posts/:pid/state`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/posts/:pid/vote`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/posts/:pid/vote`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/posts/:pid/bookmark`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/posts/:pid/bookmark`, proxyObject());

// util apis 
app.post(`${BASE_REPORT_URL}/v2/util/upload`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/util/maintenance`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/util/maintenance`, proxyObject());

// user api
app.post(`${BASE_REPORT_URL}/v2/users`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/users/:uid`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/users/:uid`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/users/:uid/password`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/users/:uid/follow`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/users/:uid/follow`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/users/:uid/chats`, proxyObject());
app.put(`${BASE_REPORT_URL}/v2/users/:uid/ban`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/users/:uid/ban`, proxyObject());
app.get(`${BASE_REPORT_URL}/v2/users/:uid/tokens`, proxyObject());
app.post(`${BASE_REPORT_URL}/v2/users/:uid/tokens`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v2/users/:uid/tokens/:token`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/username/:username`, proxyObject());

app.get(`${BASE_REPORT_URL}/v3/post/pid/:pid`, proxyObjectWithoutAuth());
app.post(`${BASE_REPORT_URL}/v3/posts/:pid`, isEditablePost(), proxyObjectForPutApi());
app.delete(`${BASE_REPORT_URL}/v3/posts/:pid`,isEditablePost() , proxyObject());
app.put(`${BASE_REPORT_URL}/v3/posts/:pid/state`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v3/posts/:pid/state`, proxyObject());
app.post(`${BASE_REPORT_URL}/v3/posts/:pid/vote`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v3/posts/:pid/vote`, proxyObject());
app.post(`${BASE_REPORT_URL}/v3/posts/:pid/bookmark`, proxyObject());
app.delete(`${BASE_REPORT_URL}/v3/posts/:pid/bookmark`, proxyObject());


app.post(`${BASE_REPORT_URL}/user/v1/create`, async (req, res) => {
  try {
    const username = req.body.request.username;
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }
    //telemetryHelper.logAPIEvent(req, 'discussion-middleware');
    // Use the createUserIfNotExists function to check and create the user
    const user = await createUserIfNotExists(req);

    res.status(200).json({result: { userId: user}});
  } catch (error) {
    logger.error({ message: "Error creating/checking user:", error });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get(`${BASE_REPORT_URL}/user/:username`, async (req, res) => {
  try {
    const username = req.params.username; // Assuming the username is provided in the request body
    //telemetryHelper.logAPIEvent(req, 'discussion-middleware');
    // Use the createUserIfNotExists function to check and create the user
    if (!username || username.trim() === '') {
      return res.status(400).json({ error: 'Username is required' });
    }
    const user = await createUserIfNotExists(req);

    res.status(200).json(user);
  } catch (error) {
    logger.error({ message: "Error creating/checking user:", error });
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get(`${BASE_REPORT_URL}/user/uid/:uid`, proxyObject());

function isEditablePost() {
  logger.info({message: "isEditablePost method called"});
  return function(req, res, next) {
    logger.info(req.body);
    const uid = parseInt(req.body.uid || req.query.uid, 10);
    const pid = parseInt(req.params.pid, 10);
    const url = `${nodebbServiceUrl}/v3/posts/${pid}`
    const options = {
      url: url,
      method: 'GET',
      json: true
    };
    logger.info(options)
      request(options, (error, response, body) => {
        if(error) {
          logger.info({message: `Error while call the api ${options.url}`})
          logger.info({message: `Error message:  ${error.message}`})
          next(error);
          return;
        }
        logger.info(body)
        logger.info(uid)
        logger.info(body.response)
        if (body.response.uid === uid && body.reponse.pid === pid) {
          logger.info({message: 'Uid got matched and the post can be deleted'})
          logger.info({message: 'uid and pid matched::'+body.uid+' '+body.pid})
          next();
        } else if (body.pid === pid){
          logger.info({message: 'Pid is not matched and you can not delete the post'})
          logger.info({message: 'Url called::'+url})
          res.status(400)
          res.send(responseObj)
        }else{
          logger.info({message: 'Uid is not matched and you can not delete the post'})
          logger.info({message: 'Url called::'+url})
          res.status(400)
          res.send(responseObj)
        }
      });
  }
}


function proxyObject() {
  return proxy(nodebbServiceUrl, {
    proxyReqOptDecorator: proxyUtils.decorateRequestHeaders(),
    proxyReqPathResolver: function (req) {
      let urlParam = req.originalUrl.replace(BASE_REPORT_URL, '');
      logger.info({"message": `request comming from ${req.originalUrl}`})
      let query = require('url').parse(req.url).query;
      if (query) {
        return require('url').parse(nodebbServiceUrl+ urlParam).path
      } else {
		    const incomingUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const proxyUrl = require('url').parse(nodebbServiceUrl + urlParam);
        logger.info({message: `Proxy req url :  ${incomingUrl}`});
        logger.info({message: `Upstream req url :  ${proxyUrl.href}`});
        return proxyUrl.path;
      }
    },
    userResDecorator: (proxyRes, proxyResData, req, res) => {
      let edata = {
        "type": "log",
        "level": "INFO",
        "requestid": req.headers['x-request-id'] || '',
        "message": ''
      };
      try {
        logger.info({ message: `request came from ${req.originalUrl}` })
        const data = proxyResData.toString('utf8');
        if (proxyRes.statusCode === 404) {
          edata['message'] = `Request url ${req.originalUrl} not found`;
          logMessage(edata, req);
          logger.info({ message: `${req.originalUrl} Not found ${data}` })
          const resCode = proxyUtils.errorResponse(req, res, proxyRes, null);
          logTelemetryEvent(req, res, data, proxyResData, proxyRes, resCode)     
          return resCode;
        } else {
          edata['message'] = `${req.originalUrl} successfull`;
	  logger.info({ message: `${req.originalUrl} found ${data}`})
          const resCode = proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req, res, null)
          logTelemetryEvent(req, res, data, proxyResData, proxyRes, resCode)
          logMessage(edata, req);
          return resCode;
        }
      } catch (err) {
        console.log('catch', err)
        edata['level'] = "Error";
        edata['message'] = `Error: ${err.message}, Url:  ${req.originalUrl}`;
        logMessage(edata, req);
        logger.info({ message: `Error while htting the ${req.url}  ${err.message}` });
        return proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req,res, err);
      }
    }
  })
}

function proxyObjectForPutApi() {
  return proxy(nodebbServiceUrl, {
    proxyReqOptDecorator: proxyUtils.decorateRequestHeadersForPutApi(),
    proxyReqPathResolver: function (req) {
      let urlParam= req.originalUrl.replace(BASE_REPORT_URL, '')
      if(urlParam.includes(methodSlug)) {
        urlParam = urlParam.replace(methodSlug, '');
      }
      logger.info({"message": `request comming from ${req.originalUrl}`})
      let query = require('url').parse(req.url).query;
      if (query) {
        return require('url').parse(nodebbServiceUrl+ urlParam).path
      } else {
		    const incomingUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const proxyUrl = require('url').parse(nodebbServiceUrl + urlParam);
        logger.info({message: `Proxy req url :  ${incomingUrl}`});
        logger.info({message: `Upstream req url :  ${proxyUrl.href}`});
        return proxyUrl.path;
      }
    },
    userResDecorator: (proxyRes, proxyResData, req, res) => {
      let edata = {
        "type": "log",
        "level": "INFO",
        "requestid": req.headers['x-request-id'] || '',
        "message": ''
      };
      try {
        logger.info({message: `request came from ${req.originalUrl}`})
        const data = (proxyResData.toString('utf8'));
        if (proxyRes.statusCode === 404 ) {
          edata['message'] = `Request url ${req.originalUrl} not found`;
          logMessage(edata, req);
          logger.info({message: `${req.originalUrl} Not found ${data}`})
          return proxyUtils.errorResponse(req, res, proxyRes, null);
        } else {
          edata['message'] = `${req.originalUrl} successfull`;
          logMessage(edata, req);
          return proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req, res, null);
        }
      } catch (err) {
        edata['level'] = "Error";
        edata['message'] = `Error: ${err.message}, Url:  ${req.originalUrl}`;
        logMessage(edata, req);
        logger.info({ message: `Error while htting the ${req.url}  ${err.message}` });
        return proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req, res, err);
      }
    }
  })
}

function proxyObjectWithoutAuth() {
  return proxy(nodebbServiceUrl, {
    proxyReqPathResolver: function (req) {
      let urlParam = req.originalUrl.replace(BASE_REPORT_URL, '');
      logger.info({"message": `request comming from ${req.originalUrl}`})
      let query = require('url').parse(req.url).query;
      if (query) {
        return require('url').parse(nodebbServiceUrl+ urlParam).path
      } else {
		    const incomingUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const proxyUrl = require('url').parse(nodebbServiceUrl + urlParam);
        logger.info({message: `Proxy req url :  ${incomingUrl}`});
        logger.info({message: `Upstream req url :  ${proxyUrl.href}`});
        return proxyUrl.path;
      }
    },
    userResDecorator: (proxyRes, proxyResData, req, res) => {
      let edata = {
        "type": "log",
        "level": "INFO",
        "requestid": req.headers['x-request-id'] || '',
        "message": ''
      };
      try {
        logger.info({ message: `request came from ${req.originalUrl}` })
        const data = proxyResData.toString('utf8');
        if (proxyRes.statusCode === 404) {
          edata['message'] = `Request url ${req.originalUrl} not found`;
          logMessage(edata, req);
          logger.info({ message: `${req.originalUrl} Not found ${data}` })
          const resCode = proxyUtils.errorResponse(req, res, proxyRes, null);
          logTelemetryEvent(req, res, data, proxyResData, proxyRes, resCode)     
          return resCode;
        } else {
          edata['message'] = `${req.originalUrl} successfull`;
          const resCode = proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req, res, null)
          logTelemetryEvent(req, res, data, proxyResData, proxyRes, resCode)
          logMessage(edata, req);
          return resCode;
        }
      } catch (err) {
        console.log('catch', err)
        edata['level'] = "Error";
        edata['message'] = `Error: ${err.message}, Url:  ${req.originalUrl}`;
        logMessage(edata, req);
        logger.info({ message: `Error while htting the ${req.url}  ${err.message}` });
        return proxyUtils.handleSessionExpiry(proxyRes, proxyResData, req,res, err);
      }
    }
  })
}

function logMessage(data, req) {
  logObj.context.env = req.originalUrl;
  logObj.context.did = req.headers['x-device-id'];
  logObj.context.sid = req.headers['x-session-id'];
  logObj.context.pdata = {
    "id": "org.sunbird.discussion-forum-middleware",
    "pid": "",
    "ver": ""
  };
  logObj.context.cdata = [];
  logObj.edata = data;
  sbLogger.info(logObj);
}

function logTelemetryEvent (req, res, data, proxyResData, proxyRes, resCode) {
 const context = {
    env: 'discussion-middleware'
  }
  let telemetryObj = {};
  if(proxyRes.statusCode === 404 ) {
      if (data !== 'Not Found' && (typeof data) !== 'string') {
        telemetryObj =   JSON.parse(proxyResData.toString('utf8'));
      } else {
        telemetryObj =  resCode;
      }
    } else {
        if (resCode.params) {
          telemetryObj = resCode;
        } else {
          telemetryObj =  JSON.parse(proxyResData.toString('utf8'));
        }
    }
  const option = telemetry.getTelemetryAPIError(telemetryObj, proxyRes, context);
   if(option) { logApiErrorEventV2(req, telemetryObj, option) }
}

function logApiErrorEventV2 (req, data, option) {
  let object = data.obj || {}
  let channel = req.headers['x-channel-id']
  const context = {
    channel: channel,
    env: option.context.env,
    cdata: [],
    did:  req.headers['x-device-id'],
    sid: req.headers['x-session-id'] 
  }
  const actor = {
    id: req.userId ? req.userId.toString() : 'anonymous',
    type: 'user'
  }
 telemetry.error({
  edata: option.edata,
  context: _.pickBy(context, value => !_.isEmpty(value)),
  object: _.pickBy(object, value => !_.isEmpty(value)),
  actor: _.pickBy(actor, value => !_.isEmpty(value))
}) 
}

async function createUserIfNotExists(request) {
  const username = request.params.username || request.body.request.username;
  logger.info("username " + username);
  try {
    return await getUserByUsername(username);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      let userEmail = null;
      let fullName = null;
      let identifier = null;
      if (request.body.request != undefined) {
        userEmail = request.body.request.email;
        fullName = request.body.request.fullname;
        identifier = request.body.request.identifier;
      }
      
      // if (!userEmail || userEmail.trim() === '') {
      //   const userInfo = await getUserInfo(request.headers['authorization'], request.headers['x-authenticated-user-token'], request.headers['x-authenticated-user-id'])
      //   userEmail = userInfo.primaryEmail;
      //   fullName = userInfo.fullName;
      // }
      
      logger.info({ message: "User not found, creating user..."});
      const createResponse = await axios.post(nodebbServiceUrl + '/v2/users?_uid=1', {
        username: username,
        fullname:  fullName,
				email: userEmail,
				isAdmin: false,
      }, {
        headers: {
          'Authorization': 'Bearer ' + authorization,
          'Content-Type': 'application/json'
        }
      });
      if (createResponse.status === 200) {
        // User exists, return the user data
        const nodeBBUser = await getUserByUsername(username);
        if (!identifier || identifier.trim() != '') {
          await updateNodeBBId(identifier, nodeBBUser.uid)
        }
        return nodeBBUser;
      }

    }
    // Handle errors appropriately
    logger.error({ message: "Error checking/creating user:", error });
    throw error;
  }
}

async function getUserByUsername(username) {
  const getUserResponse = await axios.get(nodebbServiceUrl + `/user/${username}`);

    if (getUserResponse.status === 200) {
      logger.info(getUserResponse.data)
      // User exists, return the user data
      logger.info({ message: "User exists:", username });
            return getUserResponse.data;
    }
}

function getIPList() {
  const ipAddressList = CASSANDRA_IP.split(',');
  const ipAddressWithPortList = ipAddressList.map(ipAddress => `${ipAddress}:${CASSANDRA_IP_PORT}`);
  return ipAddressWithPortList;
}

const cassandraClientOptions = /** @type {cassandraDriver.ClientOptions} */ ({
  contactPoints: getIPList(),
  keyspace: CASSANDRA_KEYSPACE,
  localDataCenter: 'datacenter1',
  queryOptions: {
      prepare: true,
  },
});

async function updateNodeBBId(identifier, nodeBBId) {
  try {
    const clientConnect = new cassandraDriver.Client(cassandraClientOptions)
    const query = `UPDATE ${CASSANDRA_KEYSPACE}.user SET nodeBBId = ? WHERE id = ?`;
    const params = [nodeBBId, identifier]
    clientConnect.execute(query, params, (err, _result) => {
      if (!err) {
        clientConnect.shutdown()
        logger.info('Update Query to user_access_paths successful')
      } else if (err) {
        clientConnect.shutdown()
        logger.error(`ERROR executing the query >> ${query}`)
      }
    })
    // })
  } catch (err) {
    logger.error(' >', err)
  }
}

async function getUserInfo(userAuthorization, AutheticatedUserToken, identifier) {
  const userReadResponse = await axios.get(learnerServiceHost + userReadPath + identifier,
    {
      headers: {
        'Authorization': userAuthorization,
        'x-authenticated-user-token': AutheticatedUserToken
      },
      'Content-Type': 'application/json'
    });

    if (userReadResponse.status === 200) {
      const primaryEmail = userReadResponse.data.result.response.profileDetails.personalDetails.primaryEmail;
      const fullName = userReadResponse.data.result.response.firstName;
      if (userReadResponse.data.result.response.lastName != null) {
        fullName = fullName + " " + lastName;
      }
      logger.info({ message: "User exists:", primaryEmail });
      if (!primaryEmail || primaryEmail.trim() === '') {
        logger.error({ message: "Issue with fetching userEmail", error });
        throw error;
      } else {
        return {primaryEmail, fullName};
      }
    }
}

// all admin apis
app.get(`${BASE_REPORT_URL}/user/admin/watched`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/admin/info`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/admin/bookmarks`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/admin/posts`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/admin/groups`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/admin/upvoted`, proxyObject());
app.get(`${BASE_REPORT_URL}/user/admin/downvoted`, proxyObject());

//app.get(`${BASE_REPORT_URL}/user/:userslug`, proxyObject())
app.get(`${BASE_REPORT_URL}/user/:userslug/upvoted`, proxyObject())
app.get(`${BASE_REPORT_URL}/user/:userslug/downvoted`, proxyObject())
app.get(`${BASE_REPORT_URL}/user/:userslug/bookmarks`, proxyObject())
app.get(`${BASE_REPORT_URL}/user/:userslug/best`, proxyObject())
app.get(`${BASE_REPORT_URL}/user/:userslug/posts`, proxyObject())

module.exports = app;
// module.exports.logMessage = logMessage;
