// @format
const {ApolloServer} = require('apollo-server');

const typeDefs = `
	# 1. Add Photo type definition
	type Photo {
	  id: ID!
		url: String!
		name: String!
		description: String
	}

  # 2. Return Photo from allPhotos
  type Query {
	  totalPhotos: Int!
		allPhotos: [Photo!]!
	}

  # 3. Return the newly posted photo from the mutation
	type Mutation {
	  postPhoto(name: String! description: String): Photo!
	}
`;

// HACK: variable we increment to make unique ids
var _id = 0;

var photos = [];

const resolvers = {
  Query: {
    totalPhotos: () => photos.length,
    allPhotos: () => photos,
  },

  Mutation: {
    postPhoto(parent, args) {
      var newPhoto = {
        id: _id++,
        ...args,
      };
      photos.push(newPhoto);

      return newPhoto;
    },
  },
  Photo: {
    url: parent => `http://yoursite.com/img/${parent.id}.jpg`,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

server
  .listen()
  .then(({url}) => console.log(`GraphQL Service running on ${url}`));
