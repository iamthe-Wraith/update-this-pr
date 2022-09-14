# update-this-pr
Add content to the top or bottom of a pr description.

## Usage
Inside your workflow file (`.github/workflows/EXAMPLE_WORKFLOW.yml`):

```yml
steps:
  - uses: iamthe-Wraith/update-this-pr@v1.0
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      top: "## Example Top" 
      bottom: "*example Bottom*"
```


## Arguments
This action currently supports 4 inputs:

| Argument      | Description                                                                       | Required |
| :------------ | :-------------------------------------------------------------------------------- | :------: |
| `token`       | The Github access token (available by default within your workflow)               | Yes      | 
| `top`         | The content to be added to the top of the PR description.                         | No       |
| `bottom`      | The content to be added to the top of the PR description.                         | No       |
| `from-branch` | __TEMPLATE VARIABLE__ Regex used to match a substring within the PR's branch name | No       |


## Using Template Variables
To add dynamic content to your `top` and `bottom` arguments, you can use predefined template variables, such as `from-branch`. If no match is found, the content will not be added.

A good example of when this could be helpful is when you want to pull a Jira ticket number from the branch name and add it to the PR description (used for some integrations).

```yml
steps:
  - uses: iamthe-Wraith/update-this-pr@v1.0
    with:
      token: ${{ secrets.GITHUB_TOKEN }}
      bottom: "Jira: {{from-branch}}" 
      from-branch: "abc-\\d+"
```

⚠️ the regex for a template variable like `from-branch` is passed as a string, and then used within `new RegExp()`. For this reason, you must escape required characters like `\`.

-----

## License

The code in this project is released under the [MIT License](license)