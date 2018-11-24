const { GraphQLScalarType } = require("graphql");

var users = [
  { githubLogin: "mHattrup", name: "Mike Hattrup" },
  { githubLogin: "gPlake", name: "Glen Plake" },
  { githubLogin: "sSchmidt", name: "Scot Schmidt" }
];

var photos = [
  {
    id: "1",
    name: "Dropping the Heart Chute",
    description: "The heart chute is one of my favorite chutes",
    category: "ACTION",
    githubUser: "gPlake",
    created: "3-28-1977"
  },
  {
    id: "2",
    name: "Enjoying the sunshine",
    category: "SELFIE",
    githubUser: "sSchmidt",
    created: "1-2-1985"
  },
  {
    id: "3",
    name: "Gunbarrel 25",
    description: "25 laps on gunbarrel today",
    category: "LANDSCAPE",
    githubUser: "sSchmidt",
    created: "2018-04-15T19:09:57.308Z"
  }
];

// HACK: variable we increment to make unique ids in the postPhoto mutation
var _id = photos
  .map(photo => parseInt(photo.id))
  // Find the largest id in our photos collection and increment by 1
  .reduce((prev, current) => (current > prev ? current + 1 : prev), 0)
  .toString();

var tags = [
  { photoID: "1", userID: "gPlake" },
  { photoID: "2", userID: "sSchmidt" },
  { photoID: "2", userID: "mHattrup" },
  { photoID: "2", userID: "gPlake" }
];

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
        .toArray()
  },

  Mutation: {
    postPhoto(parent, args) {
      var newPhoto = {
        id: _id++,
        ...args.input,
        created: new Date()
      };
      photos.push(newPhoto);

      return newPhoto;
    }
  },
  Photo: {
    url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
    postedBy: parent => {
      return users.find(u => u.githubLogin === parent.githubUser);
    },
    taggedUsers: parent =>
      tags
        // Returns an array of tags that only contain the current photo
        .filter(tag => tag.photoID === parent.id)

        // Converts the array of tags into an array of userIDs
        .map(tag => tag.userID)

        // Converts array of userIDs into an array of user objects
        .map(userID => users.find(u => u.githubLogin === userID))
  },
  User: {
    postedPhotos: parent => {
      return photos.filter(p => p.githubUser === parent.githubLogin);
    },
    inPhotos: parent =>
      tags
        // Returns an array of tags that only contain the current user
        .filter(tag => tag.userID === parent.id)

        // Converts the array of tags into an array of photoIDs
        .map(tag => tag.photoID)

        // Converts array of photoIDs into an array of photo objects
        .map(photoID => photos.find(p => p.id === photoID))
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
