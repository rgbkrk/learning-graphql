const { request } = require('graphql-request')

var query = `
query listUsers {
  allUsers {
	  name
		avatar
  }
}
`

var mutation = `
  mutation populate($count: Int!) {
	  addFakeUsers(count:$count) {
		  githubLogin
			name
		}
	}
`

var variables = { count: 3 };

request('http://localhost:3000/graphql', mutation, variables)
  .then(console.log)
	.catch(console.error)
