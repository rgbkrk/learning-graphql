const fetch = require("node-fetch");

const toJSON = res => res.json();
const throwError = error => {
  throw new Error(JSON.stringify(error));
};

// Pg. 112
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

// STUB: Needs more funcs
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

async function githubAuth(parent, { code }, { db }) {
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

module.exports = {
  githubAuth
};
