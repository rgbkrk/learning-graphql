const Query = require("./query");
const Mutation = require("./mutation");
const Types = require("./types");

const resolvers = {
  Query,

  Mutation,

  ...Types
};

module.exports = resolvers;
