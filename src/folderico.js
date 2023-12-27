const fs = require('fs')
const os = require('os')
const path = require('path')
const child_process = require('child_process')

const tempDir = os.tmpdir()
const changeWinowsFolderIcon = (folderPath, iconPath) => {
    let tempVbsPath = path.join(tempDir, 'tempVbsScript.vbs')
    let tempIniPath = path.join(tempDir, 'desktop.ini')
    let targetIniPath = path.join(folderPath, 'desktop.ini')
    let OldIconPath = path.join(folderPath, `icon?????????????.ico`)
    let iconName = `icon${new Date().getTime()}.ico`
    let targetIconPath = path.join(folderPath, iconName)
    let vbsScript = `Set wshell = createobject("wscript.shell")
    wshell.run "cmd /c echo [.ShellClassInfo] > ""${tempIniPath}""",vbhide
    wshell.run "cmd /c echo IconResource=.\\${iconName} >> ""${tempIniPath}""",vbhide
    wshell.run "attrib -S -H ""${targetIniPath}""",vbhide
    wshell.run "cmd /c del /f /q /a:sh ""${OldIconPath}"" 2>nul",vbhide
    wshell.run "cmd /c copy ""${iconPath}"" ""${targetIconPath}""",vbhide
    set shell = CreateObject("Shell.Application")
    set folder = shell.NameSpace("${folderPath}")
    folder.MoveHere "${tempIniPath}",4+16+1024
    wshell.run "attrib +S +H ""${targetIniPath}""",vbhide
    wshell.run "attrib +S +H ""${targetIconPath}""",vbhide
    wshell.run "attrib +R ""${folderPath}""",vbhide`
    fs.writeFileSync(tempVbsPath, vbsScript)
    child_process.execSync(`cscript //nologo //b "${tempVbsPath}`)
}

const changeMacFolderIcon = (folderPath, iconPath) => {
    let tempShPath = path.join(tempDir, 'tempShScript.sh')
    let shScript = `cd "${folderPath}"
    echo "read 'icns' (-16455) \\"${iconPath}\\";" >> Icon.rsrc
    Rez -a Icon.rsrc -o FileName.ext
    SetFile -a C FileName.ext
    Rez -a Icon.rsrc -o Icon$'\\r'
    SetFile -a C .
    SetFile -a V Icon$'\\r'
    rm FileName.ext Icon.rsrc`
    fs.writeFileSync(tempShPath, shScript)
    child_process.execSync(`bash "${tempShPath}"`)
}

module.exports = {
    changeMacFolderIcon,
    changeWinowsFolderIcon
}
