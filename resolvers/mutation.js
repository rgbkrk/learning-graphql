const { ObjectID } = require("mongodb");

const fetch = require("node-fetch");

const toJSON = res => res.json();
const throwError = error => {
  throw new Error(JSON.stringify(error));
};

const requestGithubToken = credentials =>
  fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(credentials)
  })
    .then(toJSON)
    .catch(throwError);

const requestGithubUserAccount = token =>
  fetch(`https://api.github.com/user?access_token=${token}`)
    .then(toJSON)
    .catch(throwError);

async function authorizeWithGithub(credentials) {
  const resp = await requestGithubToken(credentials);

  const { access_token, error } = resp;
  if (error) {
    throwError(error);
  }

  const githubUser = await requestGithubUserAccount(access_token);
  return { ...githubUser, access_token };
}

module.exports = {
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

    newPhoto.id = result.insertedId.toString();

    return newPhoto;
  },

  async tagPhoto(parent, args, { db }) {
    await db.collection("tags").replaceOne(args, args, { upsert: true });

    return db.collection("photos").findOne({ _id: ObjectID(args.photoID) });
  },

  async addFakeUsers(parent, { count }, { db }) {
    var randomUserApi = `https://randomuser.me/api/?results=${count}`;

    var { results } = await fetch(randomUserApi).then(res => res.json());

    var users = results.map(r => ({
      githubLogin: r.login.username,
      name: `${r.name.first} ${r.name.last}`,
      avatar: r.picture.thumbnail,
      githubToken: r.login.sha1
    }));

    await db.collection("users").insert(users);

    return users;
  },

  async fakeUserAuth(parent, { githubLogin }, { db }) {
    var user = await db.collection("users").findOne({ githubLogin });

    if (!user) {
      throw new Error(`Cannot find user with githubLogin "${githubLogin}"`);
    }

    return {
      token: user.githubToken,
      user
    };
  },

  async githubAuth(parent, { code }, { db }) {
    let {
      message,
      access_token,
      avatar_url,
      login,
      name
    } = await authorizeWithGithub({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    });

    if (message) {
      throw new Error(message);
    }

    let latestUserInfo = {
      name,
      githubLogin: login,
      githubToken: access_token,
      avatar: avatar_url
    };

    const {
      ops: [user]
    } = await db
      .collection("users")
      .replaceOne({ githubLogin: login }, latestUserInfo, { upsert: true });

    return { user, token: access_token };
  }
};
