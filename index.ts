import core from '@actions/core';
import github from '@actions/github';

const token = core.getInput('token');
// const top = core.getInput('top');
// const bottom = core.getInput('bottom');

// const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split('/');

// const prNum = github.context.payload.pull_request.number;

const octokit = github.getOctokit(token);


const { data: pullRequest } = await octokit.rest.pulls.get({
  owner: 'octokit',
  repo: 'rest.js',
  pull_number: 123,
  mediaType: {
    format: 'diff'
  }
});

console.log(pullRequest);

// octokit.rest.pulls.update({
//   owner: repoOwner,
//   repo: repoName,
//   pull_number: prNum,
//   body: `${top}
// })