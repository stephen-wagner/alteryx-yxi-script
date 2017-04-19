const fs = require('fs')
const path = require('path')
const archiver = require('archiver') // npm install archiver --save

// newline to make console look cleaner
console.log('\n')

// check if in correct directory
const userName = process.env['USERPROFILE'].split(path.sep)[2]
const correctDirectory = `C:\\Users\\${userName}\\AppData\\Roaming\\Alteryx\\Tools`
const checkDirectory = correctDirectory === __dirname
console.log('Current directory: ', __dirname)
if (!checkDirectory) {
	console.log("Script is in wrong directory.")
	console.log(`Move script to: ${correctDirectory}`)
	console.log('\n')
	process.exit(1)
}

// variable that stores the compressed data
const archive = archiver('zip', { store: false })

// variable to store the user selected folder. This is the root folder for the YXI
// Subfolders will also be archived
const userSelectedFolder = process.argv[2]

// checking valid inputs and directory
// check if user input is valid
const directoryItems = fs.readdirSync(__dirname)
const filterDirectoryItems = directoryItems.filter((d) => {
	return !d.includes('.')
})
const checkUserInput = filterDirectoryItems.includes(userSelectedFolder)
if (!checkUserInput) {
	console.log("Re-run script and enter a valid folder name.")
	process.exit(1)
}

// // These three commented variables are used to parameterize the folder path, so the script can run from any location.
// const selectedFolderProperties = path.parse(userSelectedFolder)
// const baseFolder = selectedFolderProperties.base
// const dirFolder = selectedFolderProperties.dir // '+(**/Users/rson/AppData/Roaming/Alteryx/Tools)' // selectedFolderProperties.dir
const newZipFolder = `./${userSelectedFolder}.yxi` // '.yxi' CHANGE TO THIS EXT
const newZipPath = path.join(__dirname, newZipFolder)

// Config.xml file: hard-code file name required for yxis
const configXml = path.join(__dirname, `${userSelectedFolder}\\Config.xml`)
const copiedConfigXml = 'Config.xml'

// YXI Icon: all icon files must match the tool name and end with 'Icon.png'
const yxiIcon = path.join(__dirname, `${userSelectedFolder}\\${userSelectedFolder}Icon.png`)
// const yxiIcon2 = path.resolve()
const copiedYxiIcon = `${userSelectedFolder}Icon.png`
// Copy the config.xml and tool icon into the YXI's root folder
fs.createReadStream(yxiIcon).pipe(fs.createWriteStream(copiedYxiIcon))
fs.createReadStream(configXml).pipe(fs.createWriteStream(copiedConfigXml))

// the output is saved in the same directory where the script was ran
// new name is from userSelectedFolder
const output = fs.createWriteStream(newZipPath)

const userSelectedFolderGlob = `${userSelectedFolder}/**`
// const userSelectedFolderGlob = path.relative(__dirname, path.join(__dirname, `${userSelectedFolder}/**`)) // path.resolve(userSelectedFolder + '/**')
// const userSelectedFolderGlob = 'Google Analytics/**' // path.relative('C:\\Users\\rson\\AppData\\Roaming\\Alteryx\\Tools', 'C:\\Users\\rson\\AppData\\Roaming\\Alteryx\\Tools\\Google Analytics' + '/**')
// const relativePathFolder = path.relative(userSelectedFolder, )
// // globObtions to filter files and folders from being archived
const globOptions = {
  ignore: [
    '**/App/**',
    '**/app/**',
    '*/Config.xml',
    '**/*.bak',
    '*/bundle.js.map',
    '**/*.git',
    '*/.gitignore',
    '**/node_modules/**',
    '*/README.md',,
    '**/reference-files/**',
    '**/testing-workflows/**'
    ] // , ['**/node_modules/*', dirFolder + '/**/node_modules', dirFolder],
}

// Function to delete files
const deleteFile = filename => {
  return fs.unlinkSync(filename)
}

// *************** ARCHIVE SECTION ******************
archive.on('error', err => { throw err })

// set stream for archive to the user selected folder
archive.pipe(output)

// append the copied Config.xml and the YXI icon to the new YXI
archive.file(copiedConfigXml)
archive.file(copiedYxiIcon)

// delete the copied Config.xml and YXI icon files
// fs.unlinkSync(copiedConfigXml) // , err => err ? console.log(err) : console.log('Copied Config.xml deleted successfully.'))

archive.glob(userSelectedFolderGlob, globOptions)
archive.finalize()

// *************** CONSOLE SUMMARY ******************
// // Console.logs
console.log('Selected directory to create YXI: ', userSelectedFolder)
// console.log('globOptions', globOptions)

// console.log('userSelectedFolderGlob: ', userSelectedFolderGlob)
// console.log('newZipPath: ', newZipPath)
// console.log('configXml: ', configXml)
// console.log('copiedConfigXml: ', copiedConfigXml)
// console.log('yxiIcon: ', yxiIcon)
// console.log('copiedYxiIcon: ', copiedYxiIcon)

// Message after archive.finalize() completes
// Delete the copied files
output.on('close', () => {
  console.log(`\narchiver has been finalized: ${archive.pointer()} total bytes\n`)
  deleteFile(copiedConfigXml)
  deleteFile(copiedYxiIcon)
})