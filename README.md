# Obsidian Sample Plugin With Tests

The first part of the readme is specific to this fork, below you will find the
unmodified content from the 
[original readme from Obsidian sample plugin](#original-readme-from-obsidian-sample-plugin)

## Notes for this fork

This repo is a fork of the sample plugin for Obsidian, with support for TDD.

The choices of libraries here are MY personal preferences, don't write me if
you don't like them, you'll not change my mind. Create your own fork instead.

There _may_ be issues with how the "restart" functionality works on Windows, it
is based on features of the linux/MacOS shells. If you can run the test runner
using sh/bash/zsh/fish or the like, it should run. Read more in the "restart"
section.

### Choice of tools

The test runner is [mocha](https://mochajs.org/), rather than jest, which seems
to be gaining a lot of popularity. But mocha is much faster, and the most
important quality of a test runner is speed. Jest also tries to do too much
IMHO, as it also includes assertion and mocking functionality, which I'd rather
use dedicated libraries for. this package includes:

- [Chai](https://www.chaijs.com/) - an assertion library, extensible through a lot of plugins
- [Sinon](https://sinonjs.org/) - Mockins and stubbing.

I've also added [sinon-chai](https://github.com/domenic/sinon-chai) so allow
simplify assertions (and get better error messages) when verifying calls to
mocked dependencies.

[tsx](https://github.com/privatenumber/tsx#readme) is used as a custom module
loader to make mocha work seemlessly with TypeScript and ES Module. (I had help
here, see [Special thanks](#special-thanks))

### Restart

The setup uses mocha in watch mode to get the fastest feedback possible. But
the combination with _tsx_ makes the process crash on syntax errors, such as
mismatched parenthesis.

In this case, the test runner should be restarted. And the solution to this
problem is _probably not_ compatible with Windows. (Let me know if it works, or
if you have a more cross-platform non-intrusive solution to this problem)

I only want to restart on this specific condition (syntax errors), and truly
shut it down on a termination signal, such as when the user presses
<key>Ctrl</key><key>+c</key>.

From casually exploratory testing, it appears that mocha exits with an exit
code of `1` in case of syntax errors, and `130` when I press
<key>Ctrl</key><key>+c</key>. So I use `[ $? -eq 1 ]` to check if we want to
restart. 

In this case I run a small node.js script that uses `fs.watch` to wait for
changes to any file before retrying (retrying immediately would cause mocha into
a continuous retry loop using CPU time until you fixed the problem).

The implementation uses `||` and `&&` shell script operators to run the
commands in sequance (which I would assume to not work on Windows outside WSL)

(Fun fact: These operators are exactly like threir JS couterparts. The
difference is that expressions are commands that you execute, and
"truthy"/"falsy" are represented by exit codes zero and non-zero. Comparisons
like `[ $? -eq 1 ]` also has an exit code)

### Examples

There are the two files in the `/tests` folder to show how this works, one file
with tests using sinon and chai, and one setup file, that configures chai with
plugins.

These are just bare bones examples to how mocha, sinon, and chai works, and
there are plenty of resources online to help you. Then also have excellent
documentation on their web sites.

Check them out, if you are new to this, or throw them await awai and build your
own setup if you already know this by heart.

### Other notes

This uses chai version 4, which is not the latest release, because sinon-chai
still has a peer dependency to that version of chai. (Should this have been
fixed when you are reading this, please write me; or even better, make a PR)

One of the great things about chai is the plugin architecture. Not only does
this allow you to write the assertions more succinctly, but the great plugins
provide improved error messages.

I really wanted to change the editor config to use 2 spaces for indents, as the
other setting is IMHO horrible. But I decided to not do that in this repo, so
simplify merging updates from the source.

## Special Thanks

Thanks goes to [@mariomui](https://github.com/mariomui) for providing help how
to setup a test runner for obsidian plugin development, pointing me towards
[tsx](https://github.com/privatenumber/tsx#readme) (which I didn't know about
before), and showing many other examples of how others have setup testing.

## Original readme from Obsidian sample plugin

This is a sample plugin for Obsidian (https://obsidian.md).

This project uses Typescript to provide type checking and documentation.
The repo depends on the latest plugin API (obsidian.d.ts) in Typescript Definition format, which contains TSDoc comments describing what it does.

**Note:** The Obsidian API is still in early alpha and is subject to change at any time!

This sample plugin demonstrates some of the basic functionality the plugin API can do.
- Adds a ribbon icon, which shows a Notice when clicked.
- Adds a command "Open Sample Modal" which opens a Modal.
- Adds a plugin setting tab to the settings page.
- Registers a global click event and output 'click' to the console.
- Registers a global interval which logs 'setInterval' to the console.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)
- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code. 
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
    "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
    "fundingUrl": {
        "Buy Me a Coffee": "https://buymeacoffee.com",
        "GitHub Sponsor": "https://github.com/sponsors",
        "Patreon": "https://www.patreon.com/"
    }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api
