// handles requests to /api/courses route

// Loads modules
const express = require("express");
const router = express.Router();
const {
  asyncErrorHandler,
  createErrorByStatus,
  authenticateUser
} = require("../utilityFunctions");
const { Course } = require("../models/index.js");
const { check, validationResult } = require("express-validator");

// Intitialises array with course validations
const courseValidations = [
  check("title")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("title is required"),
  check("description")
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage("description is required")
];

// Hadles request to / route and responds with all courses info
router.get(
  "/",
  asyncErrorHandler(async (req, res) => {
    return res.status(200).json({
      courses: await Course.getCoursesInfo()
    });
  })
);

// handles get requests to /:coursId route and responds with the course info if it exists, else responds with error
router.get(
  "/:courseId",
  asyncErrorHandler(async (req, res, next) => {
    const bookId = parseInt(req.params.courseId);
    const course = await Course.getCourseInfoById(bookId);
    return course ? res.status(200).json({ course }) : next();
  })
);

/* 
  handles post requests. Validates tthe data, authenticates the user and adds the new course under the
  the authenticated user. Responds with not data if create is successful else responds with the corresponding error
 */
router.post(
  "/",
  courseValidations,
  asyncErrorHandler(authenticateUser),
  asyncErrorHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({
        status: 400,
        message: errors.array().map(error => error.msg)
      });
    } else {
      const { title, description, estimatedTime, materialsNeeded } = req.body;
      const userId = req.currentUser.get("id");
      const { course, created } = await Course.createCourse(
        title,
        description,
        estimatedTime ? estimatedTime : "",
        materialsNeeded ? materialsNeeded : "",
        userId
      );

      if (created) {
        res.header({ Location: `/courses/${course.get("id")}` });
        return res.status(201).json({});
      } else {
        const err = new Error("Course already exists");
        err.status = 400;
        return next(err);
      }
    }
  })
);

/* 
  handles post requests. Validates tthe data, authenticates the user and updates the course if the course belongs to the
  the authenticated user. Responds with no data if update is successful else responds with the corresponding error
 */
router.put(
  "/:courseId",
  courseValidations,
  asyncErrorHandler(authenticateUser),
  asyncErrorHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({
        status: 400,
        message: errors.array().map(error => error.msg)
      });
    } else {
      const { title, description, estimatedTime, materialsNeeded } = req.body;
      const userId = req.currentUser.get("id");
      const courseId = parseInt(req.params.courseId);
      const course = await Course.getCourseInfoById(courseId);
      if (course) {
        const courseUpdated = await Course.updateCourseById(
          courseId,
          title,
          description,
          estimatedTime,
          materialsNeeded,
          userId
        );
        return courseUpdated
          ? res.status(204).json({})
          : next(createErrorByStatus(403));
      } else {
        return next();
      }
    }
  })
);

/* 
  handles delete requests. Authenticates the user and deletes the course if the course belongs to the
  the authenticated user. Responds with no data if delete is successful else responds with the corresponding error
 */
router.delete(
  "/:courseId",
  asyncErrorHandler(authenticateUser),
  asyncErrorHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next({
        status: 400,
        message: errors.array().map(error => error.msg)
      });
    } else {
      const userId = req.currentUser.get("id");
      const courseId = parseInt(req.params.courseId);
      const course = await Course.getCourseInfoById(courseId);
      if (course) {
        const courseDeleted = await Course.deleteCourseById(courseId, userId);
        return courseDeleted
          ? res.status(204).json({})
          : next(createErrorByStatus(403));
      } else {
        return next();
      }
    }
  })
);

// exports router
module.exports = router;