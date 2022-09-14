import * as core from '@actions/core';
import * as github from '@actions/github';

const templateKeyRegex = /\{\{[a-zA-Z]+}}/gmi;

enum inputKeys {
  Token = 'token',
  Top = 'top',
  Bottom = 'bottom',
  FromBranch = 'from-branch',
}

enum templateKeys {
  FromBranch = 'from-branch',
}

const token = core.getInput(inputKeys.Token, { required: true });
const top = core.getInput(inputKeys.Top);
const bottom = core.getInput(inputKeys.Bottom);
const fromBranch = core.getInput(inputKeys.FromBranch);

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

if (fromBranchMatch) {
  const branch = pullRequest.head.ref;
  const match = new RegExp(fromBranch, 'gmi').exec(branch);
  if (match?.length) fromBranchMatch = match[0];
}

const populateTemplate = (str: string) => {
  const templateKey = Object.values(templateKeys).find((key) => str.includes(`{{${key}}}`));
    switch (templateKey) {
      case templateKeys.FromBranch:
        return `${str.replace(`{{${templateKey}}}`, fromBranchMatch)}`;
      default:
        throw new Error(`Invalid template key found: ${str}`);
    }
}

if (top) body += `${templateKeyRegex.test(top) ? populateTemplate(top) : top}\n\n`;

body += pullRequest.body;

if (bottom) body += `\n\n${templateKeyRegex.test(bottom) ? populateTemplate(bottom) : bottom}\n\n`;

octokit.rest.pulls.update({
  owner: repoOwner,
  repo: repoName,
  pull_number: prNum,
  body,
})