const vscode = require('vscode')
const { exec } = require('child_process')

function activate (context) {
  if (vscode.window.activeTextEditor?.document.languageId !== 'php') {
    return
  }

  const config = vscode.workspace.getConfiguration('php-cs-fixer')

  context.subscriptions.push(vscode.commands.registerCommand('php-cs-fixer.fix', () => {
    if (!config.configFile && config.pathMode === 'intersection') {
      return vscode.window.showErrorMessage('PHP-CS-Fixer: Path mode "intersection" requires a config file be set. Please set one or change path mode to "override".')
    }

    // Get the active workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const workingDir = config.workingDir || workspaceFolders ? workspaceFolders[0].uri.fsPath : vscode.workspace.rootPath;

    if (!workingDir) {
        vscode.window.showErrorMessage("No workspace folder found!");
        return;
    }

    const param = []

    if (config.executable) {
      param.push(config.executable)
    }

    param.push(`fix ${vscode.window.activeTextEditor.document.fileName} --using-cache no`)

    if (config.configFile) {
      param.push(`--config ${config.configFile}`)
    }

    if (config.pathMode) {
      param.push(`--path-mode ${config.pathMode}`)
    }

    if (config.allowRisky) {
      param.push('--allow-risky yes')
    }

    exec(param.join(' '), { cwd: workingDir }, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage(`PHP-CS-Fixer Error: ${err.message}`);
        return;
      }
      if (stderr) {
        vscode.window.showWarningMessage(`Warning: ${stderr}`);
        return;
      }
    })
  }))

  context.subscriptions.push(vscode.workspace.onWillSaveTextDocument((e) => {
    if (e.document.languageId === 'php' && config.onSave) {
      e.waitUntil(vscode.commands.executeCommand('php-cs-fixer.fix'))
    }
  }))
}

function deactivate () { }

module.exports = { activate, deactivate }
