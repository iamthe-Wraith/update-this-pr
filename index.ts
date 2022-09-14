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

if (fromBranch) {
  const branch = pullRequest.head.ref;
  const match = new RegExp(fromBranch, 'gmi').exec(branch);
  if (match?.length) fromBranchMatch = match[0];
}

const populateTemplate = (str: string) => {
  const templateKey = Object.values(TemplateKeys).find((key) => str.includes(`{{${key}}}`));

  switch (templateKey) {
    case TemplateKeys.FromBranch:
      if (!fromBranchMatch) throw new Error('No match found for from-branch');
      return `${str.replace(`{{${templateKey}}}`, fromBranchMatch)}`;
    default:
      throw new Error(`Invalid template key found: ${str}`);
  }
}

const lines = pullRequest.body.trim().split('\n');

console.log('>>>>>>>>>>');
console.log('lines', lines);
console.log('lines[0]', lines[0]);
console.log('lines[lines.length - 1]', lines[lines.length - 1]);
console.log('>>>>>>>>>>');

if (top) {
  const topStr = templateKeyRegex.test(top) ? populateTemplate(top) : top;
  if (lines[0] !== topStr) body += `${topStr}\n\n`;
  templateKeyRegex.lastIndex = 0;
}

body += pullRequest.body;

if (bottom) {
  templateKeyRegex.lastIndex = 0;
  const bottomStr = templateKeyRegex.test(bottom) ? populateTemplate(bottom) : bottom;
  if (lines[lines.length - 1] !== bottomStr) body += `\n\n${bottomStr}`;
  templateKeyRegex.lastIndex = 0;
}

octokit.rest.pulls.update({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  body,
})