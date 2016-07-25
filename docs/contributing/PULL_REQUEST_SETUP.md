# Before Your First Pull Request
[Go back to Readme Home](../../README.md)

Thank you for your interest in the WeVoteReactNative project. Please let us know if we can help you get started.
 (contact info: https://github.com/wevote)

This document includes the steps you need to take before your first We Vote pull request. 
We recommend reading “[What the Heck is a Pull Request?](PULL_REQUEST_BACKGROUND.md)” before following these steps. 

Please [sign the Contributor License Agreement](https://www.clahub.com/agreements/wevote/WebApp) before getting started.


## Get Your Command Line Ready
`cd /Users/DaleMcGrew/NodeEnvironments/WebAppEnv/`  # Activate your node environment

`. bin/activate`

`cd /Users/<YOUR NAME HERE>/MyProjects/WeVoteReactNative`  # Change to directory where you checked out your Personal Fork from github

Before creating a branch to work in, first make sure you’re on your local
   master branch `git checkout master`  

Next, make sure that master is in sync with the upstream source of truth:
   `git fetch upstream` and then `git rebase upstream/master` Or, if you prefer
	`git pull upstream master --rebase`  


## Connect Your Personal Fork To wevote/WeVoteReactNative

  `cd /Users/<YOUR NAME HERE>/MyProjects/WeVoteReactNative`
  `vi .git/config`

Replace the “url” connection string under [remote “origin”] with:

  `url = git@github.com:YOUR_GITHUB_ACCOUNT/WeVoteReactNative.git`

Make sure your `[remote “upstream”]` lines look like this:

    [remote "upstream"]
            url = git@github.com:wevote/WeVoteReactNative.git
            fetch = +refs/heads/*:refs/remotes/upstream/*
        
Run this command to confirm your setup:

  `git remote -v`

You should see:

    origin    git@github.com:YOUR_GITHUB_ACCOUNT/WeVoteReactNative.git (fetch)
    origin    git@github.com:YOUR_GITHUB_ACCOUNT/WeVoteReactNative.git (push)
    upstream    git@github.com:wevote/WeVoteReactNative.git (fetch)
    upstream    git@github.com:wevote/WeVoteReactNative.git (push)

---

Next: [Creating a Pull Request](CREATING_PULL_REQUEST.md)

[Go back to Readme Home](../../README.md)
