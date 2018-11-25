const { ObjectID } = require("mongodb");

module.exports = {
  totalPhotos: (parent, args, { db }) =>
    db.collection("photos").estimatedDocumentCount(),

  allPhotos: (parent, args, { db }) =>
    db
      .collection("photos")
      .find()
      .toArray(),

  totalUsers: (parent, args, { db }) =>
    db.collection("users").estimatedDocumentCount(),

  allUsers: (parent, args, { db }) =>
    db
      .collection("users")
      .find()
      .toArray(),

  Photo: (parent, args, { db }) =>
    db.collection("photos").findOne({ _id: ObjectID(args.id) }),

  User: (parent, args, { db }) =>
    db.collection("users").findOne({ githubLogin: args.login }),

  me: (parent, args, { currentUser }) => currentUser
};
