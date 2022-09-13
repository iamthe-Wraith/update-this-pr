import * as core from '@actions/core';
import * as github from '@actions/github';

core.getInput('myInput');

const token = core.getInput('token', { required: true });
const top = core.getInput('top');
const bottom = core.getInput('bottom');
const topFromBranch = core.getInput('top-from-branch');
const bottomFromBranch = core.getInput('bottom-from-branch');

const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split('/');

const prNum = github.context.payload.pull_request.number;

const octokit = github.getOctokit(token);


const { data: pullRequest } = await octokit.rest.pulls.get({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  mediaType: {
    format: 'full'
  }
});

let body = '';

if (top) body += `${top}\n\n`;
if (topFromBranch && !top) {
  const branch = pullRequest.head.ref;
  const match = new RegExp(topFromBranch, 'gmi').exec(branch);
  if (match?.length) body += `${match[0].toUpperCase()}\n\n`;
}

body += pullRequest.body;

if (bottom) body += `\n\n${bottom}`;
if (bottomFromBranch && !bottom) {
  const branch = pullRequest.head.ref;
  const match = new RegExp(bottomFromBranch, 'gmi').exec(branch);
  if (match?.length) body += `${match[0].toUpperCase()}\n\n`;
}

octokit.rest.pulls.update({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  body,
})