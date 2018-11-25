const { GraphQLScalarType } = require("graphql");

const { githubAuth } = require("./auth");

const resolvers = {
  Query: {
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

    me: (parent, args, { currentUser }) => currentUser
  },

  Mutation: {
    async postPhoto(parent, args, { db, currentUser }) {
      // When there isn't a user in context, throw error
      if (!currentUser) {
        throw new Error("only an authorized user can post a photo");
      }

      const newPhoto = {
        ...args.input,
        userID: currentUser.githubLogin,
        created: new Date()
      };

      const result = await db.collection("photos").insertOne(newPhoto);

      newPhoto.id = result.insertedId.toHexString();

      return newPhoto;
    },
    githubAuth
  },
  Photo: {
    id: parent => parent.id || parent._id.toString(),
    url: parent => `/img/photos/${parent._id.toString()}.jpg`,

    postedBy: (parent, args, { db }) =>
      db.collection("users").findOne({ githubLogin: parent.userID })
  },
  User: {
    postedPhotos: (parent, args, { db }) => {
      return db
        .collection("photos")
        .find({ userID: parent.githubLogin })
        .toArray();
    }
  },
  DateTime: new GraphQLScalarType({
    name: "DateTime",
    description: "A valid date time value.",
    parseValue: value => new Date(value),
    serialize: value => new Date(value).toISOString(),
    parseLiteral: ast => ast.value
  })
};

module.exports = resolvers;
