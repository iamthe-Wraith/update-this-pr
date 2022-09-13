import * as core from '@actions/core';
import * as github from '@actions/github';

core.getInput('myInput');

const token = core.getInput('token', { required: true });
const top = core.getInput('top');
const bottom = core.getInput('bottom');

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

if (top) body += `${top}\n`;

body += pullRequest.body;

if (bottom) body += `\n${bottom}`;

octokit.rest.pulls.update({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  body,
})