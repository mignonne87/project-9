"use strict";
// exports the Course model
module.exports = (sequelize, DataTypes) => {
  // import User model
  const User = sequelize.import("./user");

  // define the Course model
  const Course = sequelize.define(
    "Course",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: {
            args: [true],
            msg: "title is required"
          },
          notEmpty: {
            args: [true],
            msg: "title is required"
          }
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: {
            args: [true],
            msg: "description is required"
          },
          notEmpty: {
            args: [true],
            msg: "description is required"
          }
        }
      },
      estimatedTime: {
        type: DataTypes.STRING,
        allowNull: true
      },
      materialsNeeded: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {}
  );

  // creates association with User model
  Course.associate = function(models) {
    // associations can be defined here
    models.Course.belongsTo(models.User, {
      foreignKey: {
        fieldName: "userId",
        allowNull: false
      }
    });

    // method that returns all Courses info with some attributes excluded
    Course.getCoursesInfo = async function() {
      return await this.findAll({
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName"]
          }
        ]
      });
    };

    // method that returns a sigle course info based on course ids
    Course.getCourseInfoById = async function(courseId) {
      return await this.findOne({
        attributes: { exclude: ["createdAt", "updatedAt"] },
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName"]
          }
        ],
        where: {
          id: courseId
        }
      });
    };
  };

  // creates a new course if it does not exist and returns an object containing it and true if created
  Course.createCourse = async function(
    title,
    description,
    estimatedTime,
    materialsNeeded,
    userId
  ) {
    try {
      const [course, created] = await this.findOrCreate({
        where: {
          title,
          description,
          estimatedTime,
          materialsNeeded,
          userId
        }
      });

      return { course, created };
    } catch (err) {
      throw err;
    }
  };

  // updates a course by user id and course id. Returns true if updated and false if not
  Course.updateCourseById = async function(
    courseId,
    title,
    description,
    estimatedTime,
    materialsNeeded,
    userId
  ) {
    try {
      const course = await this.findOne({ where: { id: courseId, userId } });
      if (course) {
        let courseUpdated = false;
        let updateFields = { title, description };

        if (description !== undefined && typeof description === "string")
          updateFields["description"] = description;
        if (estimatedTime !== undefined && typeof estimatedTime === "string")
          updateFields["estimatedTime"] = estimatedTime;
        if (
          materialsNeeded !== undefined &&
          typeof materialsNeeded === "string"
        )
          updateFields["materialsNeeded"] = materialsNeeded;

        await course.update(updateFields).then(() => {
          courseUpdated = true;
        });

        return courseUpdated;
      } else {
        return false;
      }
    } catch (err) {
      throw err;
    }
  };

  // deletes  a course by user id and course id. Returns true if deleted and false if not
  Course.deleteCourseById = async function(courseId, userId) {
    try {
      const course = await this.findOne({ where: { id: courseId, userId } });
      if (course) {
        let courseDeleted = false;

        await course.destroy({ force: true }).then(() => {
          courseDeleted = true;
        });

        return courseDeleted;
      } else {
        return false;
      }
    } catch (err) {
      throw err;
    }
  };

  return Course;
};