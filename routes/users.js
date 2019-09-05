// handles requests to /api/users route
const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const { asyncErrorHandler, authenticateUser } = require("../utilityFunctions");
const { User } = require("../models/index.js");
const { check, validationResult } = require("express-validator");

// initialize userValidation with express validator
const userValidations = [
  check("firstName")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("firstName is required"),
  check("lastName")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("lastName is required"),
  check("emailAddress")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("emailAddress is required")
    .isEmail()
    .withMessage("emailAddress is not valid")
    .custom(value => {
      return User.userEmailExists(value).then(exists => {
        // if email already exist reject
        if (exists) {
          return Promise.reject("User with Email already exists");
        }
      });
    }),
  check("password")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("passWord is required")
];

/*  
 https://stackoverflow.com/questions/48799894/trying-to-hash-a-password-using-bcrypt-inside-an-async-function
 */
const hashPassword = async password => {
  const saltRounds = 10;

  const hashedPassword = await new Promise((resolve, reject) => {
    bcryptjs.hash(password, saltRounds, function(err, hash) {
      if (err) reject(err);
      resolve(hash);
    });
  });

  return hashedPassword;
};

/* 
  Handle the get requests for route and responds with the current authenticated user
 */
router.get(
  "/",
  asyncErrorHandler(authenticateUser),
  asyncErrorHandler(async (req, res) => {
    return res.status(200).json({
      userId: req.currentUser.get("id"),
      firstName: req.currentUser.get("firstName"),
      lastName: req.currentUser.get("lastName"),
      emailAddress: req.currentUser.get("emailAddress")
    });
  })
);

/* 
  Handle posting of new user, with validation. If user successfully created 
  responds with no data and set head Location.
 */
router.post(
  "/",
  userValidations,
  asyncErrorHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({
        status: 400,
        message: errors.array().map(error => error.msg)
      });
    } else {
      const { firstName, lastName, emailAddress } = req.body;
      const hashedPassword = await hashPassword(req.body.password);
      const userCreated = await User.createNewUser(
        firstName,
        lastName,
        emailAddress,
        hashedPassword
      );

      if (userCreated) {
        res.header({ Location: "/" });
        return res.status(201).json({});
      } else {
        const err = new Error("User already exists");
        err.status = 400;
        return next(400);
      }
    }
  })
);

// exports router
module.exports = router;