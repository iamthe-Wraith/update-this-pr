import * as core from '@actions/core';
import * as github from '@actions/github';

const templateKeyRegex = /\{\{[a-zA-Z]+}}/gmi;

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

  console.log('>>>>>>>>>>>');
  console.log('str', str);
  console.log('tmeplateKey', templateKey);
  console.log('fromBranchMatch', fromBranchMatch);
  console.log('>>>>>>>>>>>');

  switch (templateKey) {
    case TemplateKeys.FromBranch:
      if (!fromBranchMatch) throw new Error('No match found for from-branch');
      return `${str.replace(`{{${templateKey}}}`, fromBranchMatch)}`;
    default:
      throw new Error(`Invalid template key found: ${str}`);
  }
}

const lines = pullRequest.body.split('\n');

if (top) {
  const topStr = `${templateKeyRegex.test(top) ? populateTemplate(top) : top}\n\n`;
  if (lines[0] !== topStr) body += topStr;
}

body += pullRequest.body;

if (bottom) {
  const bottomStr = `\n\n${templateKeyRegex.test(bottom) ? populateTemplate(bottom) : bottom}\n\n`;
  if (lines[lines.length - 1] !== bottomStr) body += bottomStr;
}

octokit.rest.pulls.update({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  body,
})