import chalk from "chalk"
import inquirer from "inquirer"
import fs from "fs"
import path from "path"
const log = console.log

const validateService = (service: string) => {
    if(!service || service.length === 0)
        throw new Error("Service name is required")

    const regex = /^[a-zA-Z0-9-]+$/;
    const isValid = regex.test(service)

    if(!isValid) 
        throw new Error("Space or any symbol is not allowed in service name you can use hyphen -")

    return service.toLowerCase()
}

const exitApp = (msg: string | null = null) => {
    const message = chalk.bgBlue.white.bold(msg || "👋 Good Bye !")
    log(message)
    process.exit(0)
}

const makeFolder = (path: string) => {
    const isExist = fs.existsSync(path)

    if(isExist)
        throw new Error(`${path.split("/").pop()} service already exist !`)

    fs.mkdirSync(path)
}

const copyFiles = (files: string[], inputPath: string, outputPath: string) => {
    files.forEach((file) => {
        fs.copyFileSync(
            path.join(`${inputPath}`, file),
            path.join(`${outputPath}`, file)
        )
    })
}

const createFiles = (files: string[], service: string, srcPath: string) => {
    files.forEach((file) => {
        const fileName = `${service}${file}`
        const filePath = path.join(srcPath, fileName)
        fs.writeFileSync(filePath, "")
    })

}

const app = async () => {
    try {
        const welcomeMessage = chalk.bgMagenta.white.bold(" ---✨✨ Welcome team ! ✨✨---\n")
        log(welcomeMessage)
        const {service} = await inquirer.prompt({
            type: 'input',
            name: 'service',
            message: chalk.yellow("Enter service name || To exit app write :q\n")
        })

        if(service === ":q")
            exitApp()

        if(service === "pipeline")
            exitApp("Pipeline name not allowed")

        const serviceName = validateService(service)
        const rootPath = process.cwd()
        const pipelinePath = rootPath

        const servicePath = path.join(rootPath, serviceName) 
        const srcPath = path.join(servicePath, "src")
        const appFilePath = path.join(srcPath, "app.ts")

        const filesListForCopy = [
            ".env",
            "Dockerfile",
            "package.json",
            "tsconfig.json",
            ".gitignore"
        ]

        const filesListForCreate = [
            ".controller.ts",
            ".router.ts",
            ".service.ts",
            ".interface.ts",
            ".middleware.ts",
            ".enum.ts",
            ".dto.ts"
        ]

        // Create Service Folder
        makeFolder(servicePath)

        // Create src Folder inside Service Folder
        makeFolder(srcPath)

        // Create app.ts inside src Folder
        fs.writeFileSync(appFilePath, "")

        // copy all required files for typescipt
        copyFiles(filesListForCopy, pipelinePath, servicePath)

        // Create required files for start coding
        createFiles(filesListForCreate, serviceName, srcPath)

        log(chalk.bgGreen.black.bold(`Success - ${serviceName} created successfully\n`))
        exitApp()

    } catch (err) {
        if(err instanceof Error) {
            log(chalk.bgRed.white.bold(`🛑 Error - ${err.message}\n`))
            app()
        }
    }
}
app()