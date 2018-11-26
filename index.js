// @format

const { MongoClient } = require("mongodb");
require("dotenv").config();
const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const expressPlayground = require("graphql-playground-middleware-express")
  .default;

const { readFileSync } = require("fs");

const typeDefs = readFileSync("./typeDefs.graphql", "UTF-8");
const resolvers = require("./resolvers");

async function start() {
  const app = express();
  const MONGO_DB = process.env.DB_HOST;

  const client = await MongoClient.connect(
    MONGO_DB,
    { useNewUrlParser: true }
  );

  const db = client.db();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const githubToken = req.headers.authorization;
      const currentUser = await db.collection("users").findOne({ githubToken });
      return { db, currentUser };
    }
  });

  server.applyMiddleware({ app });

  app.get("/", (req, res) => {
    let url = `https://github.com/login/oauth/authorize?client_id=${
      process.env.GITHUB_CLIENT_ID
    }&scope=user`;
    res.end(`
      <h1>Photo Share</h1>

      <ul>
        <li><a href="${url}">Sign In with Github</a></li>
        <li><a href="/playground">Playground</a></li>
      </ul>
      `);
  });

  app.get("/playground", expressPlayground({ endpoint: "/graphql" }));

  const port = 3000;

  app.listen({ port }, () => {
    console.log(
      `GraphQL Server running @ http://localhost:${port}${server.graphqlPath}`
    );
  });
}

start();
