import * as core from '@actions/core';
import * as github from '@actions/github';

const templateKeyRegex = /\{\{[a-zA-Z0-9-_]+}}/gmi;

enum InputKeys {
  Token = 'token',
  Top = 'top',
  Bottom = 'bottom',
  FromBranch = 'from-branch',
}

enum TemplateKeys {
  FromBranch = 'from-branch',
}

const token = core.getInput(InputKeys.Token, { required: true });
const top = core.getInput(InputKeys.Top);
const bottom = core.getInput(InputKeys.Bottom);
const fromBranch = core.getInput(InputKeys.FromBranch);

const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split('/');

const prNum = github.context.payload.pull_request.number;

const octokit = github.getOctokit(token);

// get the PR body
const { data: pullRequest } = await octokit.rest.pulls.get({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  mediaType: {
    format: 'full'
  }
});

let body = '';
let fromBranchMatch = '';

// if from-branch input has been set, find the match
// in the branch name
if (fromBranch) {
  const branch = pullRequest.head.ref;
  const match = new RegExp(fromBranch, 'gmi').exec(branch);
  if (match?.length) fromBranchMatch = match[0];
}

// takes a string with a template variable inside it
// (example "Jira: {{from-branch}}"). if is a valid template
// variable, it will replace it with the value of the variable
const populateTemplate = (str: string) => {
  const templateKey = Object.values(TemplateKeys).find((key) => str.includes(`{{${key}}}`));

  switch (templateKey) {
    case TemplateKeys.FromBranch:
      return fromBranchMatch ? `${str.replace(`{{${templateKey}}}`, fromBranchMatch)}` : '';
    default:
      throw new Error(`Invalid template key found: ${str}`);
  }
}

const lines = (pullRequest.body || '').trim().split('\n');

if (top) {
  const topStr = templateKeyRegex.test(top) ? populateTemplate(top) : top;
  if (!!topStr && lines[0] !== topStr) body += `${topStr}\n\n`; // only add the top if it's not already there
  templateKeyRegex.lastIndex = 0;
}

body += pullRequest.body;

if (bottom) {
  templateKeyRegex.lastIndex = 0;
  const bottomStr = templateKeyRegex.test(bottom) ? populateTemplate(bottom) : bottom;
  if (!!bottomStr && lines[lines.length - 1] !== bottomStr) body += `\n\n${bottomStr}`; // only add the bottom if it's not already there
  templateKeyRegex.lastIndex = 0;
}

// update the pr with new body
octokit.rest.pulls.update({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  body,
})