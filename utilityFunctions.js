// utility functions

// load modules
const auth = require("basic-auth");
const bcryptjs = require("bcryptjs");
const { User } = require("./models/index.js");

// Higher order functions, which handles errors for async route functions
const asyncErrorHandler = cb => {
  return async (req, res, next) => {
    try {
      return await cb(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
};

// accepts an error code for some reused errors and returns an error object corressponding to the error
const createErrorByStatus = statusCode => {
  let err;
  switch (statusCode) {
    case 401:
      err = new Error("Access Denied");
      break;
    case 403:
      err = new Error("Forbidden");
      break;
    default:
      statusCode = 500;
      err = new Error("Server Error");
  }

  err.status = statusCode;
  return err;
};

/*  
handles the authenticatation of the user and sets the current user in the request 
object using basic auth if authenticated else goes to error route
*/
const authenticateUser = asyncErrorHandler(async (req, res, next) => {
  const credentials = auth(req);
  let accessDenied = true;
  if (credentials) {
    const user = await User.getUserByEmail(credentials.name);
    if (user) {
      const authenticated = await bcryptjs.compare(
        credentials.pass,
        user.get("password")
      );
      if (authenticated) {
        accessDenied = false;
        req.currentUser = user;
      }
    }
  }
  return accessDenied ? next(createErrorByStatus(401)) : next();
});

// exports utility fuctions
module.exports = {
  asyncErrorHandler,
  createErrorByStatus,
  authenticateUser
};